const router = require('express').Router();
const { Team } = require('../db/models');

router.get('/lastwinner', async (req, res, next) => {
  try {
    const lastWinner = await Team.findOne({
      where: {
        isLastWinner: true,
      },
    });
    res.json(lastWinner);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const teams = await Team.findAll();
    res.send(teams);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
