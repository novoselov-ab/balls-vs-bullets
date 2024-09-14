import { Vector2 } from './../shared/math/vector2.js'
import { angleDifference } from '../shared/math/common.js'
import { Camera } from './camera.js'
import { World, Ship, Input } from './../shared/world/world.js'
import { Renderer } from './renderer.js'

const canvas = document.querySelector('canvas')

const socket = io()

const c = canvas.getContext('2d')

const THRUST_DISTANCE = 100

const camera = new Camera(new Vector2(400, 400))
const world = new World()
camera.pos = world.size.mul(0.5)
const renderer = new Renderer(canvas, world, camera)

let player = null
let input = new Input()
// const player = new Ship(new Vector2(200, 200))
// const otherShip = new Ship(new Vector2(300, 300))
// world.addEntity(player)
// world.addEntity(otherShip)
// world.addEntity(new Ship(new Vector2(20, 20)))
// world.addEntity(new Ship(new Vector2(150, 50)))
renderer.render()


var lastTime = Date.now()

var mousePos = Vector2.zero()

function update() {
  window.requestAnimationFrame(update)

  const dt = (Date.now() - lastTime) * 0.001
  lastTime = Date.now()

  if (!player) return

  // mouse input
  const playerPos = player.pos

  const dirToMouse = mousePos.sub(playerPos).normalized()
  const playerDir = player.getDirection()
  const angleDiff = playerDir.signedAngle(dirToMouse)

  if (Math.abs(angleDiff) < 0.15) {
    input.rotatingLeft = false
    input.rotatingRight = false
  }
  else if (angleDiff < 0) {
    input.rotatingLeft = true
    input.rotatingRight = false
  } else {
    input.rotatingLeft = false
    input.rotatingRight = true
  }

  // DEBUG mouse
  // otherShip.pos = mousePos

  const distance = playerPos.distance(mousePos)
  input.thrusting = distance > THRUST_DISTANCE

  input.updateNumber = world.updateNumber
  player.inputCurrent = input.clone()
  socket.emit('client_player', {
    id: player.id,
    ...input.getNetworkData()
  })

  world.update(dt)
  renderer.render()


  // mouse pos debug line
  // renderer.renderDebugLine(playerPos, mousePos)

}

// mouse 
window.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  mousePos = camera.screenToWorld(new Vector2(x, y))
})

// mouse click
window.addEventListener('mousedown', (e) => {
  input.shooting = true
})
window.addEventListener('mouseup', (e) => {
  input.shooting = false
})

window.requestAnimationFrame(update)

socket.emit('new player')

socket.on('server_state', (state) => {
  const serverTime = state.serverTime
  const players = state.players

  // if (Math.abs(world.gameTime - serverTime) > 0.5) {
  //   console.warn("server time mismatch", world.gameTime, serverTime)
  //   world.gameTime = serverTime
  // }
  world.gameTime = serverTime

  for (const playerData of players) {
    const existingPlayer = world.entities.find(e => e.id === playerData.id)
    if (existingPlayer) {
      if (existingPlayer.isPlayer) {
        existingPlayer.pos = Vector2.fromObject(playerData.pos)
        existingPlayer.angle = playerData.angle
        existingPlayer.speed = Vector2.fromObject(playerData.speed)
        existingPlayer.hp = playerData.hp
        existingPlayer.replayInputAfterUpdateNumber(playerData.lastUpdateNumber)
      }
      else {
        existingPlayer.posBuffer.push([serverTime, Vector2.fromObject(playerData.pos)])
        existingPlayer.angle = playerData.angle
        existingPlayer.speed = Vector2.fromObject(playerData.speed)
        existingPlayer.hp = playerData.hp
      }
    } else {
      const newPlayer = new Ship(playerData.id, Vector2.fromObject(playerData.pos))
      if (playerData.id === socket.id) {
        player = newPlayer
        player.isPlayer = true
        console.log("new player is me", player, player.pos.normalized())
      }
      world.addEntity(newPlayer)
    }
  }
})
