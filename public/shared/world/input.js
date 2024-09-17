import { MAX_THRUST_INPUT_AT_DISTANCE, MAX_ROTATION_INPUT_AT_ANGLE } from './constants.js'
import { clamp, clamp01 } from './../math/common.js'


export class Input {
  constructor() {
    this.shooting = false
    this.thrust = 0.0
    this.rotation = 0.0
    this.tickNumber = 0
    this.dt = 0
  }

  getNetworkData() {
    return {
      shooting: this.shooting,
      thrust: this.thrust,
      rotation: this.rotation,
      tickNumber: this.tickNumber,
      dt: this.dt
    }
  }

  syncToNetworkData(data) {
    this.shooting = data.shooting
    this.thrust = data.thrust
    this.rotation = data.rotation
    this.tickNumber = data.tickNumber
    this.dt = data.dt
  }

  setThrustToDistance(distance) {
    this.thrust = clamp01(distance / MAX_THRUST_INPUT_AT_DISTANCE)
  }

  setRotateToTarget(ship, target) {
    const dirToTarget = target.sub(ship.pos).normalized()
    const angleToTarget = ship.getDirection().signedAngle(dirToTarget)
    this.rotation = clamp(angleToTarget / MAX_ROTATION_INPUT_AT_ANGLE, -1, 1)
  }

  clone() {
    const input = new Input()
    input.shooting = this.shooting
    input.thrust = this.thrust
    this.rotation = this.rotation
    input.tickNumber = this.tickNumber
    input.dt = this.dt
    return input
  }
}