import { Entity } from './entity.js'
import { Bullet } from './bullet.js'
import { Vector2 } from '../math/vector2.js'
import { SHIP_ROTATE_SPEED, SHIP_THRUST, SHIP_SHOOTING_COOLDOWN, SHIP_HP_LOSS_COOLDOWN, WORLD_SPEED_DRAG, WORLD_DRAG } from './constants.js'
import { clamp01 } from '../math/common.js'


export class Ship extends Entity {
  constructor(id, pos) {
    super(id, pos)
    this.size = new Vector2(20, 40)
    this.speed = new Vector2(0, 0)

    this.shootingCooldown = 0
    this.hp = 100
    this.hpLossCooldown = 0
    this.shotBulletCount = 0

    this.newInputQueue = []
    this.inputBuffer = []
    this.lastInputTickNumber = 0

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
      lastInputTickNumber: this.lastInputTickNumber
    }
  }

  syncToNetworkData(serverTime, data) {
    this.pos = Vector2.fromObject(data.pos)
    this.angle = data.angle
    this.speed = Vector2.fromObject(data.speed)
    this.hp = data.hp
    this.shootingCooldown = data.shootingCooldown
    this.hpLossCooldown = data.hpLossCooldown
    this.shotBulletCount = data.shotBulletCount
    if (this.isPlayer) {
      this.replayInputAfterTickNumber(data.lastInputTickNumber)
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
      var input = this.newInputQueue.shift()
      if (!input) {
        return
      }
      if (this.newInputQueue.length > 5) {
        console.log("input queue too long, dropping", this.newInputQueue.length)
        this.newInputQueue.shift()
      }
      input.dt = dt
      this.applyInput(input)
      if (this.isPlayer) {
        this.inputBuffer.push(input)
      }
    }
    // } else {
    //   // interpolate
    //   const serverTime = this.world.gameTime - GAME_DT_MS / 1000

    //   // Find the two authoritative positions surrounding the rendering timestamp.
    //   var buffer = this.posBuffer;

    //   // Drop older positions.
    //   while (buffer.length > 2 && buffer[1][0] <= serverTime) {
    //     buffer.shift();
    //   }

    //   // Interpolate between the two surrounding authoritative positions.
    //   if (buffer.length >= 2 && buffer[0][0] <= serverTime && serverTime <= buffer[1][0]) {
    //     var x0 = buffer[0][1];
    //     var x1 = buffer[1][1];
    //     var t0 = buffer[0][0];
    //     var t1 = buffer[1][0];

    //     const t = (serverTime - t0) / (t1 - t0);
    //     this.pos = x0.lerp(x1, t);
    //   } else if (buffer.length > 0) {
    //     this.pos = buffer[buffer.length - 1][1];
    //   }
    // }
  }

  replayInputAfterTickNumber(tickNumber) {
    // drop old input
    this.inputBuffer = this.inputBuffer.filter(input => input.tickNumber > tickNumber)
    // replay input

    const prevPos = this.pos

    var i = 0
    for (const input of this.inputBuffer) {
      i++
      this.applyInput(input)
    }

    // if we moved, we need to interpolate
    const distance = this.pos.distance(prevPos)

    // console.log("replay", i, "inputs", distance)
  }

  applyInput(input) {
    const dt = input.dt
    this.shootingCooldown = Math.max(0, this.shootingCooldown - dt)
    this.hpLossCooldown = Math.max(0, this.hpLossCooldown - dt)

    if (this.alive) {
      this.rotate(SHIP_ROTATE_SPEED * input.rotation * dt)

      const acceleration = new Vector2(0, -input.thrust * SHIP_THRUST).rotate(this.angle)
      this.speed = this.speed.add(acceleration.mul(dt))

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

    this.lastInputTickNumber = input.tickNumber
  }

}
