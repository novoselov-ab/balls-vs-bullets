import { World, Ship, NpcPlayer } from './public/shared/world/world.js'
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

const world = new World()
world.isServer = true

var npcs = []

function addNpc() {
  const npc1 = new Ship("npc1", new Vector2(100, 100))
  const npcPlayer1 = new NpcPlayer(npc1)
  npcs.push(npcPlayer1)
  world.addEntity(npc1)
}

io.on('connection', (socket) => {
  console.log('a user connected')

  const player = new Ship(socket.id, new Vector2(Math.random() * 100, 200))
  world.addEntity(player)

  socket.on('disconnect', () => {
    world.removeEntity(player)
    console.log('user disconnected')

  })

  socket.on("ping", (callback) => {
    callback();
  });

  socket.on('sendPlayerInput', (input) => {
    const ship = world.entities.find(e => e.id === input.id)
    if (ship) {
      ship.inputCurrent.shooting = input.shooting
      ship.inputCurrent.thrusting = input.thrusting
      ship.inputCurrent.rotatingLeft = input.rotatingLeft
      ship.inputCurrent.rotatingRight = input.rotatingRight
      ship.inputCurrent.tickNumber = input.tickNumber
    } else {
      console.warn("no ship found", input.id)
    }
  })

})


let lastTime = Date.now()

function serverTick() {
  const realDt = (Date.now() - lastTime) * 0.001
  lastTime = Date.now()
  const dt = GAME_DT_MS / 1000
  if (Math.abs(realDt - dt) > 0.1) {
    console.warn("dt mismatch", realDt, dt)
  }
  // console.log("server dt", dt)

  for (const npc of npcs) {
    npc.update(dt)
  }

  world.update(dt)

  var state = {
    "gameTime": world.gameTime,
    "ships": world.entities.filter(e => e instanceof Ship).map(e => e.getNetworkData())
  }
  io.emit('sendServerState', state)
}

setInterval(serverTick, GAME_DT_MS) // server ticker
