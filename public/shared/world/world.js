import { Vector2 } from './../math/vector2.js'
import { Rectangle } from './../math/rectangle.js'
import { clamp01 } from './../math/common.js'
import { WORLD_DRAG, WORLD_SPEED_DRAG, SHIP_THRUST, SHIP_ROTATE_SPEED } from './constants.js'



export class World {
  constructor(size) {
    this.size = size
    this.entities = []
    this.gameTime = 0
  }

  addEntity(entity) {
    entity.setWorld(this)
    this.entities.push(entity)
  }

  render() {
    this.entities.forEach(entity => {
      entity.render()
    })
  }

  update(deltaTime) {
    this.gameTime += deltaTime
    this.entities.forEach(entity => {
      entity.update(deltaTime)
    })
  }
}

export class Entity {
  constructor(pos) {
    this.pos = pos
    this.angle = 0
    this.size = new Vector2(1, 1)
  }

  setWorld(world) {
    this.world = world
  }

  getBBox() {
    return new Rectangle(this.pos, this.size)
  }

  rotate(deltaAngle) {
    this.angle = (this.angle + deltaAngle)
    this.angle = this.angle % (Math.PI * 2)
  }

  getDirection() {
    return new Vector2(0, -1).rotate(this.angle)
  }
}

export class Ship extends Entity {
  constructor(pos) {
    super(pos)
    this.size = new Vector2(20, 40)
    this.speed = new Vector2(0, 0)

    this.rotationSpeed = SHIP_ROTATE_SPEED
    this.thrust = SHIP_THRUST

    this.thrusting = false
    this.rotatingLeft = false
    this.rotatingRight = false
  }

  update(deltaTime) {
    if (this.rotatingLeft) {
      this.rotate(-this.rotationSpeed * deltaTime)
    }
    if (this.rotatingRight) {
      this.rotate(this.rotationSpeed * deltaTime)
    }

    if (this.thrusting) {
      const acceleration = new Vector2(0, -this.thrust).rotate(this.angle)
      this.speed = this.speed.add(acceleration.mul(deltaTime))
    }

    // drag
    const dragFactor = (WORLD_SPEED_DRAG * this.speed.sqrMagnitude() + WORLD_DRAG) * deltaTime;
    this.speed = this.speed.mul(clamp01(1 - dragFactor))

    this.pos = this.pos.add(this.speed.mul(deltaTime))

  }
}