import { Vector2 } from './../math/vector2.js'
import { Rectangle } from './../math/rectangle.js'

export class World {
    constructor(size) {
      this.size = size
      this.entities = []
    }
  
    addEntity(entity) {
      this.entities.push(entity)
    }
  
    render() {
      this.entities.forEach(entity => {
        entity.render()
      })
    }
  }
  
  export class Entity {
    constructor(pos) {
      this.pos = pos
      this.angle = 0
      this.size = new Vector2(1, 1)
    }

    getBBox() {
      return new Rectangle(this.pos, this.size)
    }
  }
  
  export class Ship extends Entity {
    constructor(pos) {
      super(pos)
      this.size = new Vector2(20, 40)
    }
  }