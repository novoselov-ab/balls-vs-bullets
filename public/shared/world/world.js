import { Vector2 } from './../math/vector2.js'
import { Rectangle } from './../math/rectangle.js'
import { Segment } from '../math/segment.js'
import { Bullet } from './bullet.js'
import { Ship } from './ship.js'
import { Entity } from './entity.js'
import { clamp, clamp01, lerpAngle } from './../math/common.js'
import { WORLD_DRAG, WORLD_SPEED_DRAG, SHIP_THRUST, SHIP_ROTATE_SPEED, BULLET_SPEED, BULLET_LIFETIME, SHIP_SHOOTING_COOLDOWN, SHIP_HP_LOSS_COOLDOWN, RENDER_DELAY_MS, MAX_THRUST_INPUT_AT_DISTANCE, MAX_ROTATION_INPUT_AT_ANGLE } from './constants.js'
import { Input } from './input.js'


export class World {
  constructor(isServer = false) {
    this.size = new Vector2(1000, 1000)
    this.entities = []
    this.gameTime = 0
    this.tickNumber = 0
    this.averageDt = 0
    this.isServer = isServer
  }

  addEntity(entity) {
    entity.setWorld(this)
    this.entities.push(entity)
  }

  removeEntity(entity) {
    this.entities = this.entities.filter(e => e !== entity)
  }

  trySpawnBullet(pos, direction, owner) {
    const bulletId = `${owner.id}-${owner.shotBulletCount}`
    // find if that bullet already exists
    const entity = this.entities.find(entity => entity instanceof Bullet && entity.id === bulletId)
    if (entity) {
      return false
    }
    const bullet = new Bullet(bulletId, pos, direction, owner)
    this.addEntity(bullet)
    owner.shotBulletCount++
    return true
  }

  render(dt) {
    this.entities.forEach(entity => {
      entity.render(dt)
    })
  }

  update(dt) {
    this.entities.forEach(entity => {
      entity.update(dt)
    })

    //
    // collision detection
    //
    // bullets
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i]
      if (entity instanceof Bullet) {
        const traceSegment = new Segment(entity.prevPos, entity.pos)
        for (let j = 0; j < this.entities.length; j++) {
          const other = this.entities[j]
          if (entity != other && other.getBBox().intersectsSegment(traceSegment)) {
            entity.onCollision(other)
          }
        }
      }
    }
    // ships
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i]
      if (entity instanceof Ship) {
        for (let j = 0; j < this.entities.length; j++) {
          const other = this.entities[j]
          if (entity != other && other.getBBox().intersects(entity.getBBox())) {
            entity.onCollision(other)
          }
        }
      }
    }

    // remove dead
    this.entities = this.entities.filter(entity => entity.alive)

    // advance game time
    this.gameTime += dt
    this.tickNumber++
  }

}

