import { Vector2 } from './../shared/math/vector2.js'
import { angleDifference } from '../shared/math/common.js'
import { Camera } from './camera.js'
import { World, Ship } from './../shared/world/world.js'
import { Renderer } from './renderer.js'

const canvas = document.querySelector('canvas')

const c = canvas.getContext('2d')

const THRUST_DISTANCE = 100

const camera = new Camera(new Vector2(200, 200))
const world = new World(new Vector2(1000, 1000))
const renderer = new Renderer(canvas, world, camera)
const player = new Ship(new Vector2(200, 200))
const otherShip = new Ship(new Vector2(300, 300))
world.addEntity(player)
world.addEntity(otherShip)
// world.addEntity(new Ship(new Vector2(20, 20)))
// world.addEntity(new Ship(new Vector2(150, 50)))
renderer.render()


var lastTime = Date.now()

var mousePos = Vector2.zero()

function update() {
  window.requestAnimationFrame(update)

  const dt = (Date.now() - lastTime) * 0.001
  lastTime = Date.now()

  // mouse input
  const playerPos = player.pos

  const dirToMouse = mousePos.sub(playerPos).normalized()
  const playerDir = player.getDirection()
  const angleDiff = playerDir.signedAngle(dirToMouse)

  if (Math.abs(angleDiff) < 0.15) {
    player.rotatingLeft = false
    player.rotatingRight = false
  }
  else if (angleDiff < 0) {
    player.rotatingLeft = true
    player.rotatingRight = false
  } else {
    player.rotatingLeft = false
    player.rotatingRight = true
  }

  // DEBUG mouse
  // otherShip.pos = mousePos

  const distance = playerPos.distance(mousePos)
  player.thrusting = distance > THRUST_DISTANCE

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
  player.shooting = true
})
window.addEventListener('mouseup', (e) => {
  player.shooting = false
})

window.requestAnimationFrame(update)

