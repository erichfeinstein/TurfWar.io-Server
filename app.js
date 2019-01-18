var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var geolib = require('geolib');
const compression = require('compression');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const db = require('./db');
const sessionStore = new SequelizeStore({ db });
const passport = require('passport');

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

const CAP_RADIUS = 200;

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

app.post('/login', async (req, res, next) => {
  try {
    console.log('user attemping login!');
    const user = await User.findOne({
      where: { username: req.body.username },
    });
    if (!user) {
      console.log('No such user found:', req.body.username);
      res.status(401).send('Wrong username and/or password');
    } else if (!user.correctPassword(req.body.password)) {
      console.log('Incorrect password for user:', req.body.username);
      res.status(401).send('Wrong username and/or password');
    } else {
      req.login(user, err => (err ? next(err) : res.json(user)));
    }
  } catch (err) {
    next(err);
  }
});
sessionStore.sync();
var server = http.Server(app);
var websocket = socketio(server);
server.listen(3000, () => console.log('listening on 3000'));

// The event will be called when a client is connected.
websocket.on('connection', async socket => {
  console.log('A client just joined on', socket.id);

  //Send client current cap info
  const allCaps = await Capture.findAll({
    include: [{ model: User, include: [{ model: Team }] }],
  });
  socket.emit('all-captures', allCaps);

  //Capture a location
  socket.on('capture', async locationData => {
    console.log('Player capturing:', locationData);
    const latitude = locationData.latitude;
    const longitude = locationData.longitude;
    const userId = locationData.userId;
    const user = await User.findOne({
      where: { id: userId },
      include: [{ model: Team }],
    });

    //Filter this down to more reasonable range instead of all points
    const capPoints = await Capture.findAll({
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
  });
});
