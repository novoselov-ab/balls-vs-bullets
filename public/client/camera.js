import { Vector2 } from '../shared/math/vector2.js'
import { Rectangle } from '../shared/math/rectangle.js'

export class Camera {
  constructor(pos) {
    this.pos = pos
  }

  getBBox() {
    return new Rectangle(this.pos, this.size)
  }

  isVisible(entity) {
    return this.getBBox().intersects(entity.getBBox())
  }

  worldToScreen(pos) {
    return pos.sub(this.getBBox().getTopLeft())
  }

  screenToWorld(pos) {
    return pos.add(this.getBBox().getTopLeft())
  }
}
