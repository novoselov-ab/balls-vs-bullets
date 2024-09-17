import { Entity } from './entity.js'
import { Vector2 } from '../math/vector2.js'
import { BULLET_LIFETIME } from './constants.js'


export class Bullet extends Entity {
  constructor(id, pos, speed, ownerId) {
    super(id, pos)
    this.prevPos = pos
    this.size = new Vector2(3, 3)
    this.speed = speed
    this.lifetime = 0
    this.ownerId = ownerId
  }

  getNetworkData() {
    return {
      ...super.getNetworkData(),
      speed: this.speed,
      lifetime: this.lifetime,
      ownerId: this.ownerId,
    }
  }

  syncToNetworkData(data) {
    super.syncToNetworkData(data)
    this.lifetime = data.lifetime
    this.speed = Vector2.fromObject(data.speed)
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
