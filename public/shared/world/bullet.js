import { Entity } from './entity.js'
import { Vector2 } from '../math/vector2.js'
import { BULLET_SPEED, BULLET_LIFETIME } from './constants.js'


export class Bullet extends Entity {
  constructor(id, pos, direction, owner) {
    super(id, pos)
    this.prevPos = pos
    this.size = new Vector2(3, 3)
    this.speed = direction.normalized().mul(BULLET_SPEED)
    this.lifetime = 0
    this.owner = owner
  }

  update(deltaTime) {
    if (!this.alive) {
      return
    }
    this.prevPos = this.pos
    this.pos = this.pos.add(this.speed.mul(deltaTime))
    this.lifetime += deltaTime
    if (this.lifetime > BULLET_LIFETIME) {
      this.alive = false
    }
  }

  die() {
    this.alive = false
  }
}
