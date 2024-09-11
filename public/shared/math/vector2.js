export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    static zero() {
        return new Vector2(0, 0);
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

    // Get the magnitude (length) of the vector
    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    // Normalize the vector (set its length to 1)
    normalize() {
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
        const magnitudes = this.magnitude() * v.magnitude();
        if (magnitudes === 0) {
            throw new Error("Cannot calculate angle with zero-length vector.");
        }
        return Math.acos(dotProduct / magnitudes);
    }

    // Return a string representation of the vector
    toString() {
        return `(${this.x}, ${this.y})`;
    }
}