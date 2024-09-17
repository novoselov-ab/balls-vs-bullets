import { Vector2 } from './../math/vector2.js'
import { Rectangle } from './../math/rectangle.js'
import { Segment } from '../math/segment.js'
import { Bullet } from './bullet.js'
import { Ship } from './ship.js'
import { Player, NpcPlayer } from './player.js'
import { Entity } from './entity.js'
import { clamp, clamp01, lerpAngle } from './../math/common.js'
import { WORLD_DRAG, WORLD_SPEED_DRAG, SHIP_THRUST, SHIP_ROTATE_SPEED, BULLET_SPEED, BULLET_LIFETIME, SHIP_SHOOTING_COOLDOWN, SHIP_HP_LOSS_COOLDOWN, RENDER_DELAY_MS, MAX_THRUST_INPUT_AT_DISTANCE, MAX_ROTATION_INPUT_AT_ANGLE } from './constants.js'
import { Input } from './input.js'


export class World {
  #entityById
  #shipById
  #bulletById
  #playerById

  constructor(isServer = false) {
    this.size = new Vector2(1000, 1000)
    this.#entityById = {}
    this.#shipById = {}
    this.#bulletById = {}
    this.#playerById = {}
    this.gameTime = 0
    this.tickNumber = 0
    this.averageDt = 0
    this.isServer = isServer
  }

  addPlayer(id, name = "", isNpc = false) {
    if (name === undefined) {
      name = "noname"
    }
    if (id === undefined) {
      id = `${name}-${Math.random()}`
    }
    const player = isNpc ? new NpcPlayer(id) : new Player(id)
    player.name = name

    this.#playerById[player.id] = player

    return player
  }

  removePlayer(player) {
    if (player.ship) {
      this.removeEntity(player.ship)
    }
    delete this.#playerById[player.id]
  }

  getPlayers() {
    return Object.values(this.#playerById)
  }

  getEntities() {
    return Object.values(this.#entityById)
  }

  getEnetityById(id) {
    return this.#entityById[id]
  }

  getShips() {
    return Object.values(this.#shipById)
  }

  getShipById(id) {
    return this.#shipById[id]
  }

  getBullets() {
    return Object.values(this.#bulletById)
  }

  getBulletById(id) {
    return this.#bulletById[id]
  }

  addEntity(entity) {
    entity.setWorld(this)
    this.#entityById[entity.id] = entity
    if (entity instanceof Ship) {
      this.#shipById[entity.id] = entity
    } else if (entity instanceof Bullet) {
      this.#bulletById[entity.id] = entity
    }
  }

  removeEntity(entity) {
    this.removeEntityById(entity.id)
  }

  removeEntityById(id) {
    const entity = this.#entityById[id]
    if (entity) {
      delete this.#entityById[id]
      if (entity instanceof Bullet) {
        delete this.#bulletById[entity.id]
      } else if (entity instanceof Ship) {
        delete this.#shipById[entity.id]
      }
    }
  }

  trySpawnBullet(pos, direction, owner) {
    const bulletId = `${owner.id}-${owner.shotBulletCount}`
    // find if that bullet already exists
    const entity = this.getBulletById(bulletId)
    if (entity) {
      return false
    }
    const bullet = new Bullet(bulletId, pos, direction, owner.id)
    this.addEntity(bullet)
    owner.shotBulletCount++
    return true
  }

  render(dt) {
    this.getEntities().forEach(entity => {
      entity.render(dt)
    })
  }

  update(dt) {
    this.getEntities().forEach(entity => {
      entity.update(dt)
    })

    // Server-only logic
    if (this.isServer) {

      // npcs, players stats
      for (const player of this.getPlayers()) {
        player.update(dt)
      }

      //
      // collision detection
      //
      // bullets
      for (const bullet of this.getBullets()) {
        const traceSegment = new Segment(bullet.prevPos, bullet.pos)
        for (const other of this.getEntities()) {
          if (bullet != other && other.getBBox().intersectsSegment(traceSegment)) {
            bullet.onCollision(other)
          }
        }
      }
      // ships
      for (const ship of this.getShips()) {
        for (const other of this.getEntities()) {
          if (ship != other && other.getBBox().intersects(ship.getBBox())) {
            ship.onCollision(other)
          }
        }
      }

      // remove dead
      for (const entity of this.getEntities()) {
        if (!entity.alive) {
          this.removeEntityById(entity.id)
        }
      }
    }

    // advance game time
    this.gameTime += dt
    this.tickNumber++
  }

}

