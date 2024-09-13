import { Vector2 } from "./vector2.js";

// Helper function to calculate the orientation of the ordered triplet (p, q, r)
// Returns:
// 0 -> p, q, r are collinear
// 1 -> Clockwise
// 2 -> Counterclockwise
function orientation(p, q, r) {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0; // collinear
  return (val > 0) ? 1 : 2; // clock or counterclockwise
}

// Helper function to check if point q lies on the segment pr
function onSegment(p, q, r) {
  return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

export class Segment {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  // Get the direction vector of the Segment
  direction() {
    return this.end.sub(this.start);
  }

  // Get the normal vector of the Segment
  normal() {
    return this.direction().normalized().rotate90();
  }

  // Get the length of the Segment
  length() {
    return this.direction().magnitude();
  }

  // Get the center of the Segment
  center() {
    return this.start.add(this.direction().mul(0.5));
  }

  // Get the bounding box of the Segment
  getBBox() {
    const topLeft = new Vector2(
      Math.min(this.start.x, this.end.x),
      Math.min(this.start.y, this.end.y)
    );
    const size = new Vector2(
      Math.abs(this.start.x - this.end.x),
      Math.abs(this.start.y - this.end.y)
    );
    return new Rectangle(topLeft.add(size.mul(0.5)), size);
  }


  // Function to check if this segment intersects with another segment
  intersects(other) {
    const p1 = this.start;
    const q1 = this.end;
    const p2 = other.start;
    const q2 = other.end;

    // Find the four orientations needed for the general and special cases
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    // General case: If the orientations are different, the segments intersect
    if (o1 !== o2 && o3 !== o4) {
      return true;
    }

    // Special cases:
    // p1, q1, and p2 are collinear and p2 lies on segment p1q1
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;

    // p1, q1, and q2 are collinear and q2 lies on segment p1q1
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;

    // p2, q2, and p1 are collinear and p1 lies on segment p2q2
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;

    // p2, q2, and q1 are collinear and q1 lies on segment p2q2
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    // If none of the cases apply, the segments do not intersect
    return false;
  }

}