import { Ship } from '../shared/world/ship.js'
import { Bullet } from '../shared/world/bullet.js'
import { Vector2 } from '../shared/math/vector2.js'


const DEBUG_DRAW_DIRS = false
const DEBUG_DRAW_BBOX = false

function drawTriangle(ctx, centerX, centerY, width, height, angleInRadians, color = 'blue') {
  // Calculate the three vertices of the triangle
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Vertices of the triangle before rotation
  const vertices = [
    { x: -halfWidth, y: halfHeight },  // Bottom left
    { x: halfWidth, y: halfHeight },   // Bottom right
    { x: 0, y: -halfHeight }           // Top
  ];

  // Function to rotate the vertices
  function rotateVertex(vertex, angle) {
    return {
      x: vertex.x * Math.cos(angle) - vertex.y * Math.sin(angle),
      y: vertex.x * Math.sin(angle) + vertex.y * Math.cos(angle)
    };
  }

  // Translate and rotate vertices
  const rotatedVertices = vertices.map(v => {
    const rotated = rotateVertex(v, angleInRadians);
    return {
      x: rotated.x + centerX,
      y: rotated.y + centerY
    };
  });

  // Draw the triangle
  ctx.beginPath();
  ctx.moveTo(rotatedVertices[0].x, rotatedVertices[0].y);
  ctx.lineTo(rotatedVertices[1].x, rotatedVertices[1].y);
  ctx.lineTo(rotatedVertices[2].x, rotatedVertices[2].y);
  ctx.closePath();

  // Optionally fill and stroke
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'black';
  ctx.stroke();
}

function drawCircle(ctx, pos, radius, color = 'white') {
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawLine(ctx, fromPos, toPos, color) {
  ctx.beginPath()
  ctx.moveTo(fromPos.x, fromPos.y)
  ctx.lineTo(toPos.x, toPos.y)
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.stroke()
}

function drawRect(ctx, pos, size, color = 'white') {
  ctx.strokeStyle = color
  ctx.strokeRect(pos.x, pos.y, size.x, size.y)
}

export class Renderer {
  constructor(canvas, world, camera) {
    this.canvas = canvas
    this.world = world
    this.camera = camera
    this.lastRenderTime = Date.now()
    this.debugInfo = {}

    this.c = canvas.getContext('2d')
    window.addEventListener("resize", this.resizeCanvas.bind(this));
    this.resizeCanvas();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.size = new Vector2(this.canvas.width, this.canvas.height)
  }

  renderBackground() {
    this.c.fillStyle = 'black';
    this.c.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setDebugInfo(key, value) {
    this.debugInfo[key] = value
  }

  render() {
    const dt = (Date.now() - this.lastRenderTime) / 1000
    this.lastRenderTime = Date.now()

    this.renderBackground()

    this.world.render(dt)

    for (let entity of this.world.entities) {
      // culling
      if (!this.camera.isVisible(entity)) {
        continue
      }

      if (entity instanceof Ship) {

        // translate from world space to camera space
        const pos = this.camera.worldToScreen(entity.renderPos)

        // console.log("render", pos)

        var c = this.c
        color = entity.isPlayer ? 'orange' : 'blue'
        drawTriangle(c, pos.x, pos.y, entity.size.x, entity.size.y, entity.renderAngle, color)

        // DEBUG: dir
        if (DEBUG_DRAW_DIRS) {
          var dir = entity.getDirection().mul(20)
          var color = entity.thrusting ? 'red' : 'white'
          drawLine(c, pos, pos.add(dir), color)
        }

        // render HP
        c.font = "16px Arial";
        c.fillStyle = "white";
        c.fillText(entity.hp, pos.x - 10, pos.y - 50)


      }
      else if (entity instanceof Bullet) {
        // translate from world space to camera space
        const pos = this.camera.worldToScreen(entity.renderPos)

        drawCircle(this.c, pos, entity.size.x, 'red')
      }

      // DEBUG: bbox
      if (DEBUG_DRAW_BBOX) {
        const bbox = entity.getBBox()
        const topLeft = this.camera.worldToScreen(bbox.getTopLeft())
        const bottomRight = this.camera.worldToScreen(bbox.getBottomRight())
        drawRect(c, topLeft, bottomRight.sub(topLeft), 'green')
      }

    }

    // fps
    this.c.font = "12px Arial";
    this.c.fillStyle = "white";
    this.c.fillText("Render FPS: " + Math.round(1 / dt), 10, 30)

    // debug info
    for (const [key, value] of Object.entries(this.debugInfo)) {
      this.c.fillText(`${key}: ${value}`, 10, 50 + 20 * Object.keys(this.debugInfo).indexOf(key))
    }
  }

  renderDebugLine(fromPos, toPos, color = 'white') {
    const p0 = this.camera.worldToScreen(fromPos)
    const p1 = this.camera.worldToScreen(toPos)
    drawLine(this.c, p0, p1, color)
  }
}
