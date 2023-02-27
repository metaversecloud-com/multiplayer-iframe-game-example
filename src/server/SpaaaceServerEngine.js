import url from "url";
import { ServerEngine } from "lance-gg";
const nameGenerator = require("./NameGenerator");
const NUM_BOTS = 0;

export default class SpaaaceServerEngine extends ServerEngine {
  constructor(io, gameEngine, inputOptions) {
    super(io, gameEngine, inputOptions);
    this.scoreData = {};
  }

  // when the game starts, create robot spaceships, and register
  // on missile-hit events
  start() {
    super.start();

    // Room IDs https://github.com/jungbeomsu/Test/blob/fe9474c67073121937726deb54f0e53eb11eb4c4/src/gameServer/TownServerEngine.js

    // for (let x = 0; x < NUM_BOTS; x++) this.makeBot();

    this.gameEngine.on("missileHit", (e) => {
      // add kills
      const roomName = e.missile.roomName;
      if (this.scoreData[roomName][e.missile.ownerId]) this.scoreData[roomName][e.missile.ownerId].kills++;

      // remove score data for killed ship
      delete this.scoreData[roomName][e.ship.id];
      this.updateScore();

      //   console.log(`ship killed: ${e.ship.toString()}`);
      this.gameEngine.removeObjectFromWorld(e.ship.id);
      //   if (e.ship.isBot) {
      //     setTimeout(() => this.makeBot(), 5000);
      //   }
    });
  }

  // a player has connected
  onPlayerConnected(socket) {
    super.onPlayerConnected(socket);

    // Get the query parameters out of the URL
    const URL = socket.handshake.headers.referer;
    const parts = url.parse(URL, true);
    const query = parts.query;
    const assetId = query.assetId;

    super.createRoom(assetId);
    super.assignPlayerToRoom(socket.playerId, assetId);
    this.scoreData[assetId] = this.scoreData[assetId] || {};

    let makePlayerShip = () => {
      console.log("Rooms", this.rooms);
      let ship = this.gameEngine.makeShip(socket.playerId);
      this.assignObjectToRoom(ship, assetId);

      this.scoreData[assetId][ship.id] = {
        kills: 0,
        name: nameGenerator("general"),
      };
      this.updateScore();
    };

    // handle client restart requests
    socket.on("requestRestart", makePlayerShip);
  }

  // a player has disconnected
  onPlayerDisconnected(socketId, playerId) {
    super.onPlayerDisconnected(socketId, playerId);

    // iterate through all objects, delete those that are associated with the player (ship and missiles)
    let playerObjects = this.gameEngine.world.queryObjects({ playerId: playerId });
    playerObjects.forEach((obj) => {
      this.gameEngine.removeObjectFromWorld(obj.id);
      console.log(obj);
      //   // remove score associated with this ship
      delete this.scoreData[obj._roomName][obj.id];
    });

    this.updateScore();
  }

  //   // create a robot spaceship
  //   makeBot() {
  //     let bot = this.gameEngine.makeShip(0);
  //     bot.attachAI();
  //     this.scoreData[bot.id] = {
  //       kills: 0,
  //       name: nameGenerator("general") + "Bot",
  //     };
  //     this.updateScore();
  //   }

  updateScore() {
    // delay so player socket can catch up
    setTimeout(() => {
      this.io.sockets.emit("scoreUpdate", this.scoreData);
    }, 1000);
  }
}
