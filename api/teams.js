const router = require('express').Router();
const { Team } = require('../db/models');

router.get('/', async (req, res, next) => {
  try {
    const teams = await Team.findAll();
    res.send(teams);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
