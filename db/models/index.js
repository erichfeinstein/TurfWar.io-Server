const User = require('./user');
const Capture = require('./capture');
const Team = require('./team');

User.belongsTo(Team);
Capture.belongsTo(Team);

module.exports = {
  User,
  Capture,
  Team,
};
