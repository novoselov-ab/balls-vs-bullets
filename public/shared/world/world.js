import { Vector2 } from './../math/vector2.js'
import { Rectangle } from './../math/rectangle.js'
import { clamp01 } from './../math/common.js'
import { WORLD_DRAG, WORLD_SPEED_DRAG, SHIP_THRUST, SHIP_ROTATE_SPEED, BULLET_SPEED, BULLET_LIFETIME, SHIP_SHOOTING_COOLDOWN, SHIP_HP_LOSS_COOLDOWN } from './constants.js'



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

    //
    // collision detection
    //
    for (let i = 0; i < this.entities.length; i++) {
      const entityA = this.entities[i]
      for (let j = i + 1; j < this.entities.length; j++) {
        const entityB = this.entities[j]
        if (entityA.getBBox().intersects(entityB.getBBox())) {
          entityA.onCollision(entityB)
          entityB.onCollision(entityA)
        }
      }
    }

    // remove dead
    this.entities = this.entities.filter(entity => entity.alive)
  }
}

export class Entity {
  constructor(pos) {
    this.pos = pos
    this.angle = 0
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

export class Ship extends Entity {
  constructor(pos) {
    super(pos)
    this.size = new Vector2(20, 40)
    this.speed = new Vector2(0, 0)

    this.rotationSpeed = SHIP_ROTATE_SPEED
    this.thrust = SHIP_THRUST

    this.shooting = false
    this.shootingCooldown = 0
    this.thrusting = false
    this.rotatingLeft = false
    this.rotatingRight = false
    this.hp = 100
    this.hpLossCooldown = 0
  }

  spawnBullet() {
    const dir = this.getDirection()
    this.world.addEntity(new Bullet(this.pos.add(dir.mul(7.0)), dir, this))
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

  update(deltaTime) {
    this.shootingCooldown = Math.max(0, this.shootingCooldown - deltaTime)
    this.hpLossCooldown = Math.max(0, this.hpLossCooldown - deltaTime)

    if (this.alive) {
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

      if (this.shooting) {
        if (this.shootingCooldown <= 0) {
          this.spawnBullet()
          this.shootingCooldown = SHIP_SHOOTING_COOLDOWN
        }
      }
    }

    // drag
    const dragFactor = (WORLD_SPEED_DRAG * this.speed.sqrMagnitude() + WORLD_DRAG) * deltaTime;
    this.speed = this.speed.mul(clamp01(1 - dragFactor))

    this.pos = this.pos.add(this.speed.mul(deltaTime))

  }

}

export class Bullet extends Entity {
  constructor(pos, direction, owner) {
    super(pos)
    this.size = new Vector2(3, 3)
    this.speed = direction.normalized().mul(BULLET_SPEED)
    this.lifetime = 0
    this.owner = owner
  }

  update(deltaTime) {
    if (!this.alive) {
      return
    }
    this.pos = this.pos.add(this.speed.mul(deltaTime))
    this.lifetime += deltaTime
    if (this.lifetime > BULLET_LIFETIME) {
      this.alive = false
    }
  }

  die() {
    self.alive = false
  }
}