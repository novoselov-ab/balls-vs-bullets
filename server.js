import { World } from './public/shared/world/world.js'
import { Ship } from './public/shared/world/ship.js'
import { NpcPlayer } from './public/shared/world/player.js'
import { Input } from './public/shared/world/input.js'
import { Vector2 } from './public/shared/math/vector2.js'
import { GAME_DT_MS } from './public/shared/world/constants.js'

import express from 'express'
const app = express()

// socket.io setup
import http from 'http'
const server = http.createServer(app)
import { Server } from 'socket.io'
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/client/index.html')
})


server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})



class GameServer {
  constructor() {
    this.world = new World(true)

    this.lastTickTime = Date.now()

    io.on('connection', (socket) => {
      console.log('a user connected')

      const player = this.world.addPlayer(socket.id)

      const playerShip = new Ship(socket.id, new Vector2(Math.random() * 100, 200))
      this.world.addEntity(playerShip)

      player.setShip(playerShip)

      socket.on('disconnect', () => {
        this.world.removePlayer(player)
        console.log('user disconnected')

      })

      socket.on("ping", (callback) => {
        callback();
      });

      socket.on('sendPlayerInput', (input) => {
        const ship = this.world.getShipById(input.id)
        if (ship) {
          var newInput = new Input()
          newInput.syncToNetworkData(input)
          ship.newInputQueue.push(newInput)
        } else {
          console.warn("no ship found", input.id)
        }
      })

    })

    // Add NPCs
    this.addNpc()

    // start the game loop
    setInterval(this.serverTick.bind(this), GAME_DT_MS)
  }

  addNpc() {
    const npcPlayer = this.world.addPlayer(null, "NPC: Bob", true)
    const shipId = npcPlayer.id + "-ship"
    const npc1 = new Ship(shipId, new Vector2(100, 100))
    npcPlayer.setShip(npc1)
    this.world.addEntity(npc1)
  }

  serverTick() {
    const realDt = (Date.now() - this.lastTickTime) * 0.001
    this.lastTickTime = Date.now()
    const dt = GAME_DT_MS / 1000
    if (Math.abs(realDt - dt) > 0.1) {
      console.warn("dt mismatch", realDt, dt)
    }

    // Update world
    this.world.update(dt)

    // Send server state to all clients
    var state = {
      "gameTime": this.world.gameTime,
      "ships": this.world.getShips().map(e => e.getNetworkData()),
      "bullets": this.world.getBullets().map(e => e.getNetworkData())
    }
    io.emit('sendServerState', state)
  }
}


const gameServer = new GameServer() // Initialize the game server





