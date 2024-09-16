import { Vector2 } from './../shared/math/vector2.js'
import { Camera } from './camera.js'
import { World, Ship, Input } from './../shared/world/world.js'
import { THRUST_DISTANCE, GAME_DT_MS } from './../shared/world/constants.js'
import { Renderer } from './renderer.js'


class Client {
  constructor(window) {
    this.window = window
    this.canvas = document.querySelector('canvas')
    this.socket = io()
    this.c = this.canvas.getContext('2d')
    this.camera = new Camera(new Vector2(400, 400))
    this.world = new World()
    this.camera.pos = this.world.size.mul(0.5)
    this.renderer = new Renderer(this.canvas, this.world, this.camera)
    this.player = null
    this.lastTime = Date.now()
    this.mousePos = Vector2.zero()
    this.mouseDown = false
    this.pingMS = 0
    this.gameStarted = false

    this.socket.emit('new player')

    // mouse 
    this.window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      this.mousePos = this.camera.screenToWorld(new Vector2(e.clientX - rect.left, e.clientY - rect.top))
    })

    // mouse click
    this.window.addEventListener('mousedown', (e) => {
      this.mouseDown = true
    })
    this.window.addEventListener('mouseup', (e) => {
      this.mouseDown = false
    })

    // keep current ping
    setInterval(() => {
      const start = Date.now();

      this.socket.emit("ping", () => {
        const duration = Date.now() - start;
        this.pingMS = duration;

        // start the game when the first ping is received
        if (!this.gameStarted) this.startGame()
      });
    }, 200);
  }

  startGame() {
    if (this.gameStarted) return

    // listen for server state
    this.socket.on('sendServerState', this.onServerState.bind(this))

    // notify server of new player
    this.socket.emit('new player')

    // start the update loop
    setTimeout(() => {
      this.window.requestAnimationFrame(this.update.bind(this))
    }, GAME_DT_MS);

    this.gameStarted = true
  }

  buildPlayerInput() {
    const input = new Input()

    // rotate towards mouse
    input.setRotateToTarget(this.player, this.mousePos)

    // thrusting towards mouse
    const distance = this.player.pos.distance(this.mousePos)
    input.thrusting = distance > THRUST_DISTANCE

    // shooting
    input.shooting = this.mouseDown

    // remember tick number
    input.tickNumber = this.world.tickNumber

    return input
  }

  update() {
    setTimeout(() => {
      this.window.requestAnimationFrame(this.update.bind(this))
    }, GAME_DT_MS);

    const dt = (Date.now() - this.lastTime) * 0.001

    if (dt < GAME_DT_MS / 1000) {
      console.warn("dt too small, skipping frame", dt)
      return
    }

    this.lastTime = Date.now()

    if (!this.player) return

    // Build and send input
    this.player.inputCurrent = this.buildPlayerInput()
    this.socket.emit('sendPlayerInput', {
      id: this.player.id,
      ...this.player.inputCurrent.getNetworkData()
    })

    // Update world
    this.world.update(dt)

    // Render
    this.renderer.setDebugInfo("ping", this.pingMS)
    this.renderer.render()

    // mouse pos debug line
    // renderer.renderDebugLine(playerPos, mousePos)
  }

  onServerState(state) {
    const serverTime = state.gameTime
    const ships = state.ships

    if (Math.abs(this.world.gameTime - serverTime) > GAME_DT_MS * 10 / 1000) {
      const clientTimeBefore = this.world.gameTime
      this.world.gameTime = serverTime + this.pingMS / 2000
      console.log("server <-> client time syncing:", clientTimeBefore, "->", this.world.gameTime, "ping:", this.pingMS, "ms", "serverTime:", serverTime)
    }
    this.world.gameTime = serverTime

    for (const shipData of ships) {
      const ship = this.world.entities.find(e => e.id === shipData.id)
      if (ship) {
        ship.syncToNetworkData(serverTime, shipData)
      } else {
        const ship = new Ship(shipData.id, Vector2.fromObject(shipData.pos))
        if (shipData.id === this.socket.id) {
          this.player = ship
          this.player.isPlayer = true
        }
        this.world.addEntity(ship)
      }
    }

    // remove disconnected players
    this.world.entities = this.world.entities.filter(e => !(e instanceof Ship && !ships.find(p => p.id === e.id)))

  }
}

const client = new Client(window) // Initialize the client