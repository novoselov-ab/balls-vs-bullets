import { Vector2 } from './../math/vector2.js'
import { Rectangle } from './../math/rectangle.js'
import { Segment } from '../math/segment.js'
import { clamp01 } from './../math/common.js'
import { WORLD_DRAG, WORLD_SPEED_DRAG, SHIP_THRUST, SHIP_ROTATE_SPEED, BULLET_SPEED, BULLET_LIFETIME, SHIP_SHOOTING_COOLDOWN, SHIP_HP_LOSS_COOLDOWN, GAME_DT_MS } from './constants.js'



export class World {
  constructor() {
    this.size = new Vector2(1000, 1000)
    this.entities = []
    this.gameTime = 0
    this.tickNumber = 0
    this.averageDt = 0
    this.isServer = false
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

  render() {
    this.entities.forEach(entity => {
      entity.render()
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

export class Entity {
  constructor(id, pos) {
    this.id = id
    this.pos = pos
    this.posBuffer = []
    this.angle = 0
    this.angleBuffer = []
    this.size = new Vector2(1, 1)
    this.alive = true
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
}

export class Input {
  constructor() {
    this.shooting = false
    this.thrusting = false
    this.rotatingLeft = false
    this.rotatingRight = false
    this.tickNumber = 0
    this.dt = 0
  }

  getNetworkData() {
    return {
      shooting: this.shooting,
      thrusting: this.thrusting,
      rotatingLeft: this.rotatingLeft,
      rotatingRight: this.rotatingRight,
      tickNumber: this.tickNumber,
      dt: this.dt
    }
  }

  setRotateToTarget(ship, target) {
    const dirToTarget = target.sub(ship.pos).normalized()
    const angleToTarget = ship.getDirection().signedAngle(dirToTarget)

    if (Math.abs(angleToTarget) < 0.15) {
      this.rotatingLeft = false
      this.rotatingRight = false
    }
    else if (angleToTarget < 0) {
      this.rotatingLeft = true
      this.rotatingRight = false
    } else {
      this.rotatingLeft = false
      this.rotatingRight = true
    }
  }

  clone() {
    const input = new Input()
    input.shooting = this.shooting
    input.thrusting = this.thrusting
    input.rotatingLeft = this.rotatingLeft
    input.rotatingRight = this.rotatingRight
    input.tickNumber = this.tickNumber
    input.dt = this.dt
    return input
  }
}

export class Ship extends Entity {
  constructor(id, pos) {
    super(id, pos)
    this.size = new Vector2(20, 40)
    this.speed = new Vector2(0, 0)

    this.rotationSpeed = SHIP_ROTATE_SPEED
    this.thrust = SHIP_THRUST

    this.shootingCooldown = 0
    this.hp = 100
    this.hpLossCooldown = 0
    this.shotBulletCount = 0

    this.inputCurrent = new Input()
    this.inputBuffer = []

    // true for a current player on a client
    this.isPlayer = false

  }

  getNetworkData() {
    return {
      id: this.id,
      pos: this.pos,
      angle: this.angle,
      speed: this.speed,
      hp: this.hp,
      shootingCooldown: this.shootingCooldown,
      hpLossCooldown: this.hpLossCooldown,
      shotBulletCount: this.shotBulletCount,
      lastInputTickNumber: this.inputCurrent.tickNumber
    }
  }

  syncToNetworkData(serverTime, data) {
    if (this.isPlayer) {
      this.pos = Vector2.fromObject(data.pos)
      this.angle = data.angle
      this.speed = Vector2.fromObject(data.speed)
      this.hp = data.hp
      this.shootingCooldown = data.shootingCooldown
      this.hpLossCooldown = data.hpLossCooldown
      this.shotBulletCount = data.shotBulletCount
      this.replayInputAfterTickNumber(data.lastInputTickNumber)
    }
    else {
      this.posBuffer.push([serverTime, Vector2.fromObject(data.pos)])
      this.angle = data.angle
      this.speed = Vector2.fromObject(data.speed)
      this.hp = data.hp
    }
  }

  trySpawnBullet() {
    const dir = this.getDirection()
    return this.world.trySpawnBullet(this.pos.add(dir.mul(7.0)), dir, this)
  }

  onCollision(other) {
    if (other instanceof Bullet) {
      if (other.owner != this) {
        this.damage()
        other.die()
      }
    }
    else if (other instanceof Ship) {
      this.speed = other.speed.mul(0.5).add(this.speed.mul(0.5))
      this.damage()
    }
  }

  damage(amount = 1) {
    if (this.hpLossCooldown > 0) {
      return
    }
    this.hp -= amount
    this.hpLossCooldown = SHIP_HP_LOSS_COOLDOWN
  }

  update(dt) {
    if (this.world.isServer || this.isPlayer) {
      this.inputCurrent.dt = dt
      this.applyInput(this.inputCurrent)
      if (this.isPlayer) {
        this.inputBuffer.push(this.inputCurrent)
      }
    } else {
      // interpolate
      const serverTime = this.world.gameTime - GAME_DT_MS / 1000

      // Find the two authoritative positions surrounding the rendering timestamp.
      var buffer = this.posBuffer;

      // Drop older positions.
      while (buffer.length > 2 && buffer[1][0] <= serverTime) {
        buffer.shift();
      }

      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0][0] <= serverTime && serverTime <= buffer[1][0]) {
        var x0 = buffer[0][1];
        var x1 = buffer[1][1];
        var t0 = buffer[0][0];
        var t1 = buffer[1][0];

        const t = (serverTime - t0) / (t1 - t0);
        this.pos = x0.lerp(x1, t);
      } else if (buffer.length > 0) {
        this.pos = buffer[buffer.length - 1][1];
      }
    }
  }

  replayInputAfterTickNumber(tickNumber) {
    // drop old input
    this.inputBuffer = this.inputBuffer.filter(input => input.tickNumber > tickNumber)
    // replay input

    for (const input of this.inputBuffer) {
      this.applyInput(input)
    }
  }

  applyInput(input) {
    const dt = input.dt
    this.shootingCooldown = Math.max(0, this.shootingCooldown - dt)
    this.hpLossCooldown = Math.max(0, this.hpLossCooldown - dt)

    if (this.alive) {
      if (input.rotatingLeft) {
        this.rotate(-this.rotationSpeed * dt)
      }
      if (input.rotatingRight) {
        this.rotate(this.rotationSpeed * dt)
      }

      if (input.thrusting) {
        const acceleration = new Vector2(0, -this.thrust).rotate(this.angle)
        this.speed = this.speed.add(acceleration.mul(dt))
      }

      if (input.shooting) {
        if (this.shootingCooldown <= 0) {
          if (this.trySpawnBullet()) {
            this.shootingCooldown = SHIP_SHOOTING_COOLDOWN
          }
        }
      }
    }

    // drag
    const dragFactor = (WORLD_SPEED_DRAG * this.speed.sqrMagnitude() + WORLD_DRAG) * dt;
    this.speed = this.speed.mul(clamp01(1 - dragFactor))

    this.pos = this.pos.add(this.speed.mul(dt))

    // out of bounds check
    if (this.pos.x < 0) this.pos.x = 0
    if (this.pos.x > this.world.size.x) this.pos.x = this.world.size.x
    if (this.pos.y < 0) this.pos.y = 0
    if (this.pos.y > this.world.size.y) this.pos.y = this.world.size.y

  }

}

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

export class NpcPlayer {
  constructor(ship) {
    this.ship = ship
    this.waypoint = new Vector2(0, 0)
    this.waypointCooldown = 0
  }

  update(dt) {
    if (this.waypointCooldown > 0) {
      this.waypointCooldown -= dt
    } else {
      this.waypoint = new Vector2(Math.random() * 1000, Math.random() * 1000)
      this.waypointCooldown = 3.0
    }

    this.ship.inputCurrent.setRotateToTarget(this.ship, this.waypoint)

    const distance = this.ship.pos.distance(this.waypoint)
    this.ship.inputCurrent.thrusting = distance > 100

  }
}