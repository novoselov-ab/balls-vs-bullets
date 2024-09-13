import { World, Ship } from './public/shared/world/world.js'
import { Vector2 } from './public/shared/math/vector2.js'

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

io.on('connection', (socket) => {
  console.log('a user connected')

  const player = new Ship(new Vector2(Math.random() * 100, 200), socket.id)
  world.addEntity(player)

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })

  socket.on('client_player', (playerData) => {
    const player = world.entities.find(e => e.id === playerData.id)
    if (player) {
      player.shooting = playerData.shooting
      player.thrusting = playerData.thrusting
      player.rotatingLeft = playerData.rotatingLeft
      player.rotatingRight = playerData.rotatingRight
    }
  })

})


const serverTickMs = 100
let lastTime = Date.now()
let gameTime = 0


function serverTick() {
  const realDt = (Date.now() - lastTime) * 0.001
  lastTime = Date.now()
  const dt = serverTickMs / 1000
  if (Math.abs(realDt - dt) > 0.1) {
    console.warn("dt mismatch", realDt, dt)
  }
  // console.log("server dt", dt)

  world.update(dt)

  io.emit('players', world.entities.filter(e => e instanceof Ship).map(e => e.getNetworkData()))
}

setInterval(serverTick, serverTickMs) // server ticker
