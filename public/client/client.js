import { Vector2 } from './../shared/math/vector2.js'
import { Camera } from './camera.js'
import { World, Ship } from './../shared/world/world.js'
import { Renderer } from './renderer.js'

const canvas = document.querySelector('canvas')

const c = canvas.getContext('2d')


const camera = new Camera(new Vector2(200, 200))
const world = new World(new Vector2(1000, 1000))
const renderer = new Renderer(canvas, world, camera)
world.addEntity(new Ship(new Vector2(20, 20)))
world.addEntity(new Ship(new Vector2(150, 50)))
renderer.render()

setInterval(() => {
    world.entities.forEach(entity => {
        entity.angle += 1
    })
    renderer.render()
})