import React from 'react';
import axios from 'axios';

export default class LandingPage extends React.Component {
  constructor() {
    super();
    this.state = {
      winningTeam: {},
    };
  }
  async componentDidMount() {
    const winningTeam = await axios.get('/api/teams/lastwinner');
    this.setState({ winningTeam: winningTeam.data });
  }
  render() {
    return (
      <div align="center">
        <h1>TurfWar.io</h1>
        <div id="last-winner">
          <h3>Last week's winner:</h3>
          <h3 style={{ color: this.state.winningTeam.color }}>
            {this.state.winningTeam.name}
          </h3>
          <h3>Time remaining this round:</h3>
        </div>
        <div id="desc" align="center">
          <div align="center" style={{ width: '400px' }}>
            <p style={{ textAlign: 'left' }}>
              TurfWar.io is a GPS-based, global game of territory control.
              Players can join teams and use capture tokens to take over
              territory around the world, or steal territory from enemy players.
            </p>
            <a href="https://expo.io/@ericfeinstein/turfwar-io">
              Get it on Expo
            </a>
          </div>
          <hr />
          <h4 align="center">Tech Stack</h4>
          <ul align="center">
            <li>React Native</li>
            <li>Node.js</li>
            <li>Express.js</li>
            <li>PostgreSQL</li>
          </ul>
          <div id="links">
            <a href="https://github.com/erichfeinstein/TurfWar.io">
              GitHub App
            </a>
            <br />
            <a href="https://github.com/erichfeinstein/TurfWar.io-Server">
              GitHub Server
            </a>
          </div>
        </div>
      </div>
    );
  }
}
