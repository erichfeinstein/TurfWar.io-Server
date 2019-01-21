'use strict';

const db = require('./db');
const { User, Team, Capture } = require('./db/models');

const randomLocation = require('random-location');

const defaultRadius = 80;

async function seed() {
  await db.sync({ force: true });
  console.log('db synced!');

  const teams = await Promise.all([
    Team.create({
      color: '#ff000090',
      name: 'Red',
    }),
    Team.create({
      color: '#2200ff90',
      name: 'Blue',
    }),
    //Stretch goal
    // Team.create({
    //   color: '#FFD70090',
    //   name: 'Treasure',
    // }),
  ]);

  const users = await Promise.all([
    User.create({
      username: 'eric',
      password: '123',
    }),
    User.create({
      username: 'jo',
      password: '123',
    }),
    User.create({
      username: 'justin',
      password: '123',
    }),
    // User.create({
    //   username: 'TreasureProvider',
    //   password: 'supersecretpassword',
    // }),
  ]);

  const caps = await Promise.all([
    Capture.create({
      latitude: 40.7205,
      longitude: -74.01,
      radius: defaultRadius,
    }),
    Capture.create({
      latitude: 40.7305,
      longitude: -74.005,
      radius: defaultRadius,
    }),
    Capture.create({
      latitude: 40.7105,
      longitude: -74.005,
      radius: defaultRadius,
    }),
    Capture.create({
      latitude: 41.019,
      longitude: -73.75,
      radius: defaultRadius,
    }),
    Capture.create({
      latitude: 41.045,
      longitude: -73.79,
      radius: defaultRadius,
    }),
    Capture.create({
      latitude: 41.038,
      longitude: -73.77,
      radius: defaultRadius,
    }),
    //FSA coords
    Capture.create({
      latitude: 40.707,
      longitude: -74.011,
      radius: defaultRadius,
    }),
  ]);

  // Generate random coords in NYC
  const lowerManhattan = {
    latitude: 40.719,
    longitude: -73.997,
  };
  const noho = {
    latitude: 40.729,
    longitude: -73.992,
  };
  const midtown = {
    latitude: 40.752,
    longitude: -73.986,
  };
  const bronx = {
    latitude: 40.849,
    longitude: -73.8788,
  };
  const yankeeStadium = {
    latitude: 40.829,
    longitude: -73.926,
  };
  const myRouteToFSA = {
    latitude: 40.917,
    longitude: -73.851,
  };

  for (let i = 0; i <= 200; i++) {
    let coords;
    if (i <= 30)
      coords = randomLocation.randomCirclePoint(lowerManhattan, 1100);
    else if (i <= 30) coords = randomLocation.randomCirclePoint(midtown, 1500);
    else if (i <= 50) coords = randomLocation.randomCirclePoint(noho, 1500);
    else if (i <= 100) coords = randomLocation.randomCirclePoint(bronx, 4400);
    else if (i <= 120)
      coords = randomLocation.randomCirclePoint(yankeeStadium, 3000);
    else coords = randomLocation.randomCirclePoint(myRouteToFSA, 5000);
    console.log(coords);

    const cap = await Capture.create({
      latitude: coords.latitude,
      longitude: coords.longitude,
      radius: defaultRadius,
    });
    const userId = Math.floor(Math.random() * 3) + 1;
    await cap.setUser(userId);
  }
  await users[0].setTeam(teams[0].id);
  await users[1].setTeam(teams[1].id);
  await users[2].setTeam(teams[0].id);
  // await users[3].setTeam(teams[2].id);
  Promise.all([
    caps[0].setUser(users[0].id),
    caps[1].setUser(users[1].id),
    caps[2].setUser(users[2].id),
    caps[3].setUser(users[2].id),
    caps[4].setUser(users[1].id),
    caps[5].setUser(users[2].id),
  ]);
  await caps[6].setUser(users[2].id);

  console.log(`seeded successfully`);
}

async function generateTreasure() {
  const treasureSrc = {
    latitude: 40.729,
    longitude: -73.992,
  };
  for (let i = 0; i <= 10; i++) {
    let coords = randomLocation.randomCirclePoint(treasureSrc, 1500);
    const cap = await Capture.create({
      latitude: coords.latitude,
      longitude: coords.longitude,
      radius: defaultRadius,
    });
    //Set it to treasure user
    await cap.setUser(4);
  }
}

//Use with caution
async function NJ() {
  const nj = {
    latitude: 40.7892,
    longitude: -74.2242,
  };
  for (let i = 0; i <= 1000; i++) {
    let coords = randomLocation.randomCirclePoint(nj, 45 * 1000);
    console.log(coords);
    const cap = await Capture.create({
      latitude: coords.latitude,
      longitude: coords.longitude,
      radius: defaultRadius,
    });
    //Set it to treasure user
    const userId = Math.floor(Math.random() * 3) + 1;
    await cap.setUser(userId);
  }
}

async function runSeed() {
  console.log('seeding...');
  try {
    await seed();
    // await generateTreasure();
    // NOT STABLE
    await NJ();
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
