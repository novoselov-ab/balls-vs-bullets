import { Vector2 } from '../math/vector2.js'
import { Input } from './input.js'

export class Player {
  constructor(id) {
    this.id = id
    this.name = ""
    this.ship = null
    this.kills = 0
    this.deaths = 0
  }

  setShip(ship) {
    this.ship = ship
  }

  update(dt) {
    // To be implemented by subclasses
  }
}

export class NpcPlayer extends Player {
  constructor(id) {
    super(id)
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

    var input = new Input()

    input.setRotateToTarget(this.ship, this.waypoint)

    const distance = this.ship.pos.distance(this.waypoint)
    input.setThrustToDistance(distance)

    this.ship.newInputQueue.push(input)
  }
}