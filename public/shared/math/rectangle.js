import { Vector2 } from "./vector2.js";
import { Segment } from "./segment.js";

export class Rectangle {
  constructor(position, size) {
    this.position = position; // Vector2 center
    this.size = size;         // Vector2 for size (width and height)
  }

  getHalfSize() {
    return this.size.mul(0.5);
  }

  getTopLeft() {
    return this.position.sub(this.getHalfSize());
  }

  getBottomRight() {
    return this.position.add(this.getHalfSize());
  }

  // Check if this rectangle intersects with another rectangle
  intersects(other) {
    const topLeft = this.getTopLeft();
    const bottomRight = this.getBottomRight();
    const otherTopLeft = other.getTopLeft();
    const otherBottomRight = other.getBottomRight();

    return bottomRight.x >= otherTopLeft.x &&
      topLeft.x <= otherBottomRight.x &&
      bottomRight.y >= otherTopLeft.y &&
      topLeft.y <= otherBottomRight.y
  }

  intersectsSegment(other) {
    const topLeft = this.getTopLeft();
    const bottomRight = this.getBottomRight();

    if (other.intersects(new Segment(topLeft, new Vector2(bottomRight.x, topLeft.y)))) {
      return true;
    }
    if (other.intersects(new Segment(new Vector2(bottomRight.x, topLeft.y), bottomRight))) {
      return true;
    }
    if (other.intersects(new Segment(bottomRight, new Vector2(topLeft.x, bottomRight.y)))) {
      return true;
    }
    if (other.intersects(new Segment(new Vector2(topLeft.x, bottomRight.y), topLeft))) {
      return true;
    }
    return false;
  }


  // Check if a point (Vector2) is inside the rectangle
  contains(point) {
    const topLeft = this.getTopLeft();
    const bottomRight = this.getBottomRight();

    return point.x >= topLeft.x &&
      point.x <= bottomRight.x &&
      point.y >= topLeft.y &&
      point.y <= bottomRight.y;
  }

  // String representation of the rectangle
  toString() {
    return `Rectangle(Position: ${this.position.toString()}, Size: ${this.size.toString()})`;
  }
}