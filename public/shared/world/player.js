import { Vector2 } from '../math/vector2.js'
import { Input } from './input.js'
import { RESPAWN_COOLDOWN } from './constants.js'

export class Player {
  constructor(id) {
    this.id = id
    this.name = ""
    this.ship = null
    this.kills = 0
    this.deaths = 0
    this.isCurrentPlayer = false
    this.respawnCooldown = 0
  }

  getNetworkData() {
    return {
      id: this.id,
      name: this.name,
      kills: this.kills,
      deaths: this.deaths,
      respawnCooldown: this.respawnCooldown,
    }
  }

  syncToNetworkData(data) {
    this.name = data.name
    this.kills = data.kills
    this.deaths = data.deaths
    this.respawnCooldown = data.respawnCooldown
  }

  setShip(ship) {
    this.ship = ship
  }

  die() {
    this.deaths++
    this.ship = null
    this.respawnCooldown = RESPAWN_COOLDOWN
  }

  update(dt) {
    // To be implemented by subclasses
    if (this.respawnCooldown > 0) {
      this.respawnCooldown -= dt
    }
  }

  shouldRespawn() {
    return this.ship === null && this.respawnCooldown <= 0
  }
}

export class NpcPlayer extends Player {
  constructor(id) {
    super(id)
    this.waypoint = new Vector2(0, 0)
    this.waypointCooldown = 0
  }

  update(dt) {
    super.update(dt)

    if (!this.ship) {
      return
    }

    if (this.waypointCooldown > 0) {
      this.waypointCooldown -= dt
    } else {
      this.waypoint = new Vector2(Math.random() * 1000, Math.random() * 1000)
      this.waypointCooldown = 3.0
    }

    var input = new Input()

    input.setRotateToTarget(this.ship, this.waypoint)

    const distance = this.ship.pos.distance(this.waypoint)
    input.setThrustToDistance(distance)

    this.ship.newInputQueue.push(input)
  }
}