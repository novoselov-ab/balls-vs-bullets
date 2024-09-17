import { Vector2 } from '../math/vector2.js'
import { Rectangle } from '../math/rectangle.js'
import { clamp01, lerpAngle } from '../math/common.js'
import { RENDER_DELAY_MS } from './constants.js'

export class Entity {
  constructor(id, pos) {
    this.id = id
    this.pos = pos
    this.renderPos = pos
    this.angle = 0
    this.renderAngle = 0
    this.size = new Vector2(1, 1)
    this.alive = true
  }

  getNetworkData() {
    return {
      id: this.id,
      pos: this.pos,
      angle: this.angle,
    }
  }

  syncToNetworkData(data) {
    this.pos = Vector2.fromObject(data.pos)
    this.angle = data.angle
  }

  setWorld(world) {
    this.world = world
  }

  getBBox() {
    return new Rectangle(this.pos, this.size)
  }

  onCollision(other) {
  }

  rotate(deltaAngle) {
    this.angle = (this.angle + deltaAngle)
    this.angle = this.angle % (Math.PI * 2)
  }

  getDirection() {
    return new Vector2(0, -1).rotate(this.angle)
  }

  render(dt) {
    const t = clamp01(dt / (RENDER_DELAY_MS * 0.001))
    // interpolate position and angle for rendering:
    this.renderPos = this.renderPos.add(this.pos.sub(this.renderPos).mul(t))
    this.renderAngle = lerpAngle(this.renderAngle, this.angle, t)
  }
}

