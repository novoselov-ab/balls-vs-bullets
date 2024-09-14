import { clamp, clamp01 } from "./common.js";

const EPSILON_NORMAL_SQRT = 1e-15;

export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  static zero() {
    return new Vector2(0, 0);
  }
  static fromObject(obj) {
    return new Vector2(obj.x, obj.y);
  }

  // Add another vector to this one
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  // Subtract another vector from this one
  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  // Multiply this vector by a scalar
  mul(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  // Divide this vector by a scalar
  divide(scalar) {
    if (scalar !== 0) {
      return new Vector2(this.x / scalar, this.y / scalar);
    }
    throw new Error("Division by zero is not allowed.");
  }


  sqrMagnitude() {
    return this.x ** 2 + this.y ** 2;
  }

  // Get the magnitude (length) of the vector
  magnitude() {
    return Math.sqrt(this.sqrMagnitude());
  }

  // Normalize the vector (set its length to 1)
  normalized() {
    const mag = this.magnitude();
    if (mag > 0) {
      return this.divide(mag);
    }
    return new Vector2(0, 0);  // Vector with zero length can't be normalized
  }

  // Dot product of this vector and another vector
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  // Get the distance between this vector and another vector
  distance(v) {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  // Get the angle between this vector and another vector
  angle(v) {
    const dotProduct = this.dot(v);
    const denominator = Math.sqrt(this.sqrMagnitude() * v.sqrMagnitude());
    if (denominator < EPSILON_NORMAL_SQRT) {
      return 0;
    }
    const dot = clamp(dotProduct / denominator, -1., 1.);
    return Math.acos(dot);
  }

  rotate90() {
    return new Vector2(-this.y, this.x);
  }

  // Get the signed angle between this vector and another vector
  signedAngle(v) {
    const unsignedAngle = this.angle(v);
    const sign = Math.sign(this.x * v.y - this.y * v.x);
    return unsignedAngle * sign;
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos)
  }

  lerp(v, t) {
    return this.add(v.sub(this).mul(clamp01(t)));
  }

  // Return a string representation of the vector
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}