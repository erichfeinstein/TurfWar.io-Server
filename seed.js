'use strict';

const db = require('./db');
const { User, Team, Capture } = require('./db/models');

async function seed() {
  await db.sync({ force: true });
  console.log('db synced!');

  const teams = await Promise.all([
    Team.create({
      color: '#ff000090',
    }),
    Team.create({
      color: '#2200ff90',
    }),
  ]);

  const users = await Promise.all([
    User.create({
      name: 'Eric',
      username: 'eric',
      password: '123',
    }),
    User.create({
      name: 'Justin',
      username: 'justin',
      password: '123',
    }),
    User.create({
      name: 'Joseph',
      username: 'jo',
      password: '123',
    }),
  ]);

  const caps = await Promise.all([
    Capture.create({
      latitude: 40.7205,
      longitude: -74.01,
      radius: 200,
    }),
    Capture.create({
      latitude: 40.7305,
      longitude: -74.005,
      radius: 200,
    }),
    Capture.create({
      latitude: 40.7105,
      longitude: -74.005,
      radius: 200,
    }),
    Capture.create({
      latitude: 41.019,
      longitude: -73.75,
      radius: 200,
    }),
    Capture.create({
      latitude: 41.0419,
      longitude: -73.79,
      radius: 200,
    }),
    Capture.create({
      latitude: 41.038,
      longitude: -73.77,
      radius: 200,
    }),
    //FSA coords
    Capture.create({
      latitude: 40.706,
      longitude: -74.01,
      radius: 200,
    }),
  ]);

  await users[0].setTeam(teams[0].id);
  await users[1].setTeam(teams[0].id);
  await users[2].setTeam(teams[1].id);
  await caps[0].setUser(users[0].id);
  await caps[1].setUser(users[1].id);
  await caps[2].setUser(users[0].id);
  await caps[3].setUser(users[2].id);
  await caps[4].setUser(users[1].id);
  await caps[5].setUser(users[2].id);
  //FSA capture point
  await caps[6].setUser(users[2].id);

  console.log(`seeded successfully`);
}
async function runSeed() {
  console.log('seeding...');
  try {
    await seed();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    console.log('closing db connection');
    await db.close();
    console.log('db connection closed');
  }
}
if (module === require.main) {
  runSeed();
}
module.exports = seed;
