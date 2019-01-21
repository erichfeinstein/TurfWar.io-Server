const router = require('express').Router();
const { User, Capture, Team } = require('../db/models');

router.get('/rememberme', async (req, res, next) => {
  if (req.user) {
    console.log('remembering user');
    const team = await Team.findById(req.user.dataValues.teamId);
    const capsPlaced = await Capture.findAll({
      where: {
        userId: req.user.dataValues.id,
      },
    });
    console.log(`Returning member of the ${team.name} team`);
    const returningUserInfo = {
      id: req.user.id,
      username: req.user.username,
      team,
      capCount: req.user.capCount,
      capsPlaced,
    };
    res.json(returningUserInfo);
  } else res.json({});
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { username: req.body.username },
      include: [{ model: Team }],
    });
    if (!user) {
      console.log('No such user found:', req.body.username);
      res.status(401).send('Wrong username and/or password');
    } else if (!user.correctPassword(req.body.password)) {
      console.log('Incorrect password for user:', req.body.username);
      res.status(401).send('Wrong username and/or password');
    } else {
      //We send the user their cap count info so they can see if they have caps available, but capping uses info from the DB
      req.login(user, err =>
        err
          ? next(err)
          : res.json({
              id: user.id,
              username: user.username,
              team: user.team,
              capCount: user.capCount,
            })
      );
    }
  } catch (err) {
    next(err);
  }
});

router.post('/signup', async (req, res, next) => {
  try {
    //Check that teamId is valid
    const team = await Team.findById(req.body.teamId);
    console.log(`user signing up and joining ${team.name} team`);
    if (team) {
      const user = await User.create({
        username: req.body.username,
        password: req.body.password,
      });
      await user.setTeam(team.id);
      if (!user) {
        console.log('Problem creating account for user');
        res.status(401).send('There was a problem creating your account');
      } else {
        req.login(user, err =>
          err
            ? next(err)
            : res.json({
                id: user.id,
                username: user.username,
                team,
                capCount: user.capCount,
              })
        );
      }
    }
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  console.log('user signing out');
  req.logout();
  req.session.destroy();
  res.send('logged out');
});

module.exports = router;
