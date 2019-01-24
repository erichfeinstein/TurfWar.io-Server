var express = require('express');
const path = require('path');
var http = require('http');
var socketio = require('socket.io');
var geolib = require('geolib');
const compression = require('compression');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const db = require('./db');
const sessionStore = new SequelizeStore({ db });
const passport = require('passport');

const { and, gt, lt } = require('sequelize').Op;

if (process.env.NODE_ENV === 'test') {
  after('close the session store', () => sessionStore.stopExpiringSessions());
}

// passport registration
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.models.user.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

//This distance is used to query the Capture table for all nearby capture points when a user tries to capture a new point
const MAX_DISTANCE_AWAY = 0.05;
const CAP_RADIUS = 80;

const { User, Team, Capture } = require('./db/models');

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'TEST',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// auth and api routes
app.use('/auth', require('./auth'));
app.use('/api', require('./api'));

//Get the local time of the next round end time of the server
app.get('/end-time', (req, res, next) => {
  var date = new Date();
  //Gets the next friday at noon, to show countdown to game end
  date.setDate(date.getDate() + (5 + 7 - date.getDay()) % 7);
  date.setHours(12, 0, 0, 0);
  res.status(200).json(date);
});

app.use(express.static(path.join(__dirname, 'public')));
//Landing page for Heroku
app.get('*', function(req, res) {
  res.sendfile('./public/index.html');
});

sessionStore.sync();
var server = http.Server(app);
var websocket = socketio(server);
server.listen(process.env.PORT || 3000, () => console.log('app is running!'));

//Websocket

// The event will be called when a client is connected.
websocket.on('connection', async socket => {
  console.log('A client just joined on', socket.id);
  socket.on('disconnect', () => {
    socket.disconnect();
    console.log(socket.id, 'has disconnected!');
  });
  //Send client current cap info and the current radius for new caps
  const allCaps = await Capture.findAll({
    include: [{ model: User, include: [{ model: Team }] }],
  });
  socket.emit('all-captures', allCaps, CAP_RADIUS);

  //Capture a location
  socket.on('capture', async locationData => {
    console.log('Player attempting capture', locationData);
    const latitude = locationData.latitude;
    const longitude = locationData.longitude;
    const userId = locationData.userId;
    const user = await User.findOne({
      where: { id: userId },
      include: [{ model: Team }],
    });
    const userCapCount = user.capCount;

    if (user && userCapCount >= 1) {
      //Look at any nearby cap points for collisions
      const capPoints = await Capture.findAll({
        where: {
          [and]: {
            latitude: {
              [and]: [
                { [gt]: latitude - MAX_DISTANCE_AWAY },
                { [lt]: latitude + MAX_DISTANCE_AWAY },
              ],
            },
            longitude: {
              [and]: [
                { [gt]: longitude - MAX_DISTANCE_AWAY },
                { [lt]: longitude + MAX_DISTANCE_AWAY },
              ],
            },
          },
        },
        include: [{ model: User, include: [{ model: Team }] }],
      });
      capPoints.forEach(cap => {
        if (
          geolib.getDistance(
            { latitude, longitude },
            { latitude: cap.latitude, longitude: cap.longitude }
          ) <
          CAP_RADIUS * 2
        ) {
          console.log('In range of another cap');
          //Broadcast to clients to remove this cap TODO
          if (cap.user.team.id !== user.team.id) {
            socket.emit('destroy-cap', { cap });
            socket.broadcast.emit('destroy-cap', { cap });
            cap.destroy();
          } else {
            console.log('It is a cap of the same team');
          }
        }
      });
      try {
        const newCap = await Capture.create({
          latitude,
          longitude,
          radius: CAP_RADIUS,
        });
        await newCap.setUser(user);
        await user.update({ capCount: userCapCount - 1 });
        if (user.capCount < 1) socket.emit('out-of-caps');

        //Send new cap info to client who capped
        socket.emit('new-cap', {
          id: newCap.id,
          latitude: newCap.latitude,
          longitude: newCap.longitude,
          radius: CAP_RADIUS,
          user,
        });
        //Send new cap info to all other clients
        socket.broadcast.emit('new-cap', {
          id: newCap.id,
          latitude: newCap.latitude,
          longitude: newCap.longitude,
          radius: CAP_RADIUS,
          user,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      socket.emit('out-of-caps');
    }
  });
});

//Schedule give users a set amount of caps every day at midnight
//0 0 0 * * *
const RESET_CAP_COUNT = 3;
const schedule = require('node-schedule');
//Enter cron date with schedule job
const daily = schedule.scheduleJob('0 0 0 * * *', async () => {
  await User.update(
    { capCount: RESET_CAP_COUNT },
    {
      where: {
        capCount: { [lt]: RESET_CAP_COUNT },
      },
    }
  );
  websocket.emit('daily-reset');
});

//Weekly reset
//0 0 12 * * 6
const weekly = schedule.scheduleJob('0 0 12 * * 6', async () => {
  const allCaps = await Capture.findAll({
    include: [{ model: User, include: [{ model: Team }] }],
  });
  let totalPoints = {};
  allCaps.map(cap => {
    if (!totalPoints[cap.user.team.id]) totalPoints[cap.user.team.id] = 1;
    else totalPoints[cap.user.team.id] = totalPoints[cap.user.team.id] + 1;
  });
  let max = 0;
  let teamId = 0;
  let teamsPoints = Object.entries(totalPoints);
  for (let i = 0; i < teamsPoints.length; i++) {
    if (teamsPoints[i][1] > max) {
      max = teamsPoints[i][1];
      teamId = Number(teamsPoints[i][0]);
    }
  }
  await Team.update(
    { isLastWinner: false },
    {
      where: {
        isLastWinner: true,
      },
    }
  );
  let lastTeamWinner = await Team.findById(teamId);
  lastTeamWinner.update({
    isLastWinner: true,
  });
  //Destroy all captures to reset the game
  Capture.destroy({
    where: {},
    truncate: true,
  });

  console.log(
    '///////////////////////////////////////////////////////////////'
  );
  console.log('Winner this week:', lastTeamWinner.name);
  console.log(
    '///////////////////////////////////////////////////////////////'
  );
});
