var express = require('express');
var http = require('http');
var socketio = require('socket.io');
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
// compression middleware
app.use(compression());

// const createApp = () => {
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
// };

var server = http.Server(app);
var websocket = socketio(server);
server.listen(3000, () => console.log('listening on 3000'));

// The event will be called when a client is connected.
websocket.on('connection', async socket => {
  console.log('A client just joined on', socket.id);

  //Send client current cap info
  const allCaps = await Capture.findAll({
    include: [{ model: Team }],
  });
  socket.emit('all-captures', allCaps);

  //Capture a location
  socket.on('capture', async locationData => {
    console.log('Player capturing:', locationData);
    //Logic to delete TODO
    const newCap = await Capture.create({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      radius: CAP_RADIUS,
    });
    socket.emit('new-cap', newCap);
  });
});

// const syncDb = () => db.sync();

// async function bootApp() {
//   await sessionStore.sync();
//   await syncDb();
//   await createApp();
// }
// bootApp();
