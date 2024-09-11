import { Ship } from '../shared/world/world.js'
import { Vector2 } from '../shared/math/vector2.js'


function drawTriangle(ctx, centerX, centerY, width, height, rotation) {
    // Calculate the three vertices of the triangle
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const angleInRadians = (Math.PI / 180) * rotation;

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
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

export class Renderer {
    constructor(canvas, world, camera) {
        this.canvas = canvas
        this.world = world
        this.camera = camera

        this.c = canvas.getContext('2d')
        window.addEventListener("resize", this.resizeCanvas);
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.camera.size = new Vector2(this.canvas.width, this.canvas.height)
        console.log("camera size", this.camera.size)
    }


    render() {



        for (let entity of this.world.entities) {


            if (entity instanceof Ship) {
                // culling
                if (!this.camera.isVisible(entity)) {
                    continue
                }

                // translate from world space to camera space
                const pos = this.camera.worldToScreen(entity.pos)

                console.log("render", pos)

                var c = this.c
                drawTriangle(c, pos.x, pos.y, entity.size.x, entity.size.y, entity.angle)

            }
        }
    }
}
