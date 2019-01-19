const Sequelize = require('sequelize');
const db = require('../db');

const Team = db.define('team', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  color: {
    type: Sequelize.STRING,
    defaultValue: '000000',
  },
});

module.exports = Team;
