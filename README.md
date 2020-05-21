# Summary

TurfWar.io is a GPS-based, global game of territory control. It was developed as a hackathon project during my time studying at Fullstack Academy. It is currently deployed and available via Expo, and the server is launched on Heroku. The game was inspired by territory-based games like Splatoon and Planetside, and its incorporation of GPS as a game mechanic was inspired by Pokemon Go. This application is for **hosting the web application**.

# Technology

This repository stores the code for the web application that hosts the database and server for connecting players together. For the mobile application code, visit: https://github.com/erichfeinstein/TurfWar.io. The TurfWar.io web app was built with the following tools:

- React
- Node
- Express
- Socket.io
- PostgreSQL / Sequelize
- Cron scheduling

At its core, this web application is a Node/Express app that will authenticate users, allocate their daily play tokens, and allow them to play. Socket.io is utilized to communicate to all players when a player places a capture zone in the world. The data for users and capture zones is stored in a PostgreSQL database, and Sequelize is used as an ORM to make working with this data more natural. A React application is also served by this server which displays some more information about the full TurfWar.io stack. It also displays the result of a cron-scheduled task for determining and displaying the game winner, and counting down the current round.

# How to Run

To run the TurfWar.io web application, please do the following:

- `git clone` the repo.
- Navigate into the repo, and run `npm i` to install all dependencies.
- With `postgres` installed, run `createdb turfwario`.
- Run `npm seed` (optional) to get some dummy data for the mobile app to display.
- Now the React Native mobile app will be able to connect and display capture points.
- Visit `localhost:3000` to view the React application and see game data.
