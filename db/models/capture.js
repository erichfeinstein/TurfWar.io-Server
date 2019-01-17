const Sequelize = require('sequelize');
const db = require('../db');

const Capture = db.define('capture', {
  latitude: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  radius: {
    //in meters
    type: Sequelize.INTEGER,
  },
});

module.exports = Capture;
