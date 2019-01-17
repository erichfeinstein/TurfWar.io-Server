// const Sequelize = require('sequelize');
// const db = new Sequelize('postgres://localhost:5432/turfwario');

// module.exports = db;
const db = require('./db');

// register models
require('./models');

module.exports = db;
