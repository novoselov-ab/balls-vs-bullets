

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}


export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function repeat(value, max) {
  return clamp(value - Math.floor(value / max) * max, 0, max);
}

export function lerpAngle(a, b, t) {
  var delta = repeat(b - a, Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  return a + delta * clamp01(t);
}

export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

export function angleDifference(target, source) {
  return Math.atan2(Math.sin(target - source), Math.cos(target - source));
}