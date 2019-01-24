import React from 'react';
import axios from 'axios';

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;

export default class LandingPage extends React.Component {
  constructor() {
    super();
    this.state = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      winningTeam: {},
      endTime: {},
    };
    this.showRemaining = this.showRemaining.bind(this);
  }
  async componentDidMount() {
    const winningTeam = await axios.get('/api/teams/lastwinner');
    this.setState({ winningTeam: winningTeam.data });
    const end = await axios.get('/end-time');
    await this.setState({
      endTime: new Date(end.data),
    });
    this.interval = setInterval(this.showRemaining, 1000);
  }
  async showRemaining() {
    var end = this.state.endTime;
    var now = new Date();
    var diff = end - now;
    var days = Math.floor(diff / day);
    var hours = Math.floor((diff % day) / hour);
    var minutes = Math.floor((diff % hour) / minute);
    var seconds = Math.floor((diff % minute) / second);
    await this.setState({
      days,
      hours,
      minutes,
      seconds,
    });
  }
  render() {
    return (
      <div align="center">
        <h1>TurfWar.io</h1>
        <div id="last-winner">
          {this.state.winningTeam ? (
            <div>
              <h3>Last week's winner:</h3>
              <h3 style={{ color: this.state.winningTeam.color }}>
                {this.state.winningTeam.name}
              </h3>
            </div>
          ) : (
            <div />
          )}
          <div>
            <h3>Time remaining this round:</h3>
            <h3 style={{ color: 'grey' }}>{`${this.state.days} days ${
              this.state.hours
            } hours ${this.state.minutes} minutes ${
              this.state.seconds
            } seconds`}</h3>
          </div>
        </div>
        <div id="desc" align="center">
          <div align="center">
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
