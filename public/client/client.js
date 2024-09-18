import { Vector2 } from './../shared/math/vector2.js'
import { Camera } from './camera.js'
import { World } from './../shared/world/world.js'
import { Ship } from './../shared/world/ship.js'
import { Input } from './../shared/world/input.js'
import { Bullet } from './../shared/world/bullet.js'
import { MAX_THRUST_INPUT_AT_DISTANCE, GAME_DT_MS } from './../shared/world/constants.js'
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
        this.renderer.setDebugInfo("ping", this.pingMS)

        // start the game when the first ping is received
        if (!this.gameStarted) this.startGame()
      });
    }, 200);
  }

  startGame() {
    if (this.gameStarted) return

    // listen for server state
    this.socket.on('sendServerState', this.onServerState.bind(this))

    // listen for player stats
    this.socket.on('sendPlayerStats', this.onPlayerStats.bind(this))

    // notify server of new player
    this.socket.emit('new player')

    // start the update loop
    setTimeout(this.update.bind(this), GAME_DT_MS);

    // start the render loop
    this.window.requestAnimationFrame(this.render.bind(this))

    this.gameStarted = true
  }

  buildPlayerInput() {
    const input = new Input()

    // rotate towards mouse
    input.setRotateToTarget(this.player, this.mousePos)

    // thrusting towards mouse
    const distance = this.player.pos.distance(this.mousePos)
    input.setThrustToDistance(distance)

    // shooting
    input.shooting = this.mouseDown

    // remember tick number
    input.tickNumber = this.world.tickNumber

    return input
  }

  render() {
    this.window.requestAnimationFrame(this.render.bind(this))
    this.renderer.render()
  }

  update() {
    setTimeout(this.update.bind(this), GAME_DT_MS);

    const dt = (Date.now() - this.lastTime) * 0.001

    if (dt < (GAME_DT_MS / 1000) * 0.9) {
      console.warn("dt too small, skipping frame", dt)
      return
    }

    this.lastTime = Date.now()

    if (!this.player) return

    // Build and send input
    const newInput = this.buildPlayerInput()
    this.socket.emit('sendPlayerInput', {
      id: this.player.id,
      ...newInput.getNetworkData()
    })
    this.player.newInputQueue.push(newInput)

    // Update world
    this.world.update(dt)

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
      const ship = this.world.getShipById(shipData.id)
      if (ship) {
        ship.syncToNetworkData(serverTime, shipData)
      } else {
        const ship = new Ship(shipData.id, Vector2.fromObject(shipData.pos))
        if (shipData.id === this.socket.id) {
          this.player = ship
          this.player.isPlayer = true
          this.player.name = "Player"
        }
        this.world.addEntity(ship)
      }
    }

    for (const bulletData of state.bullets) {
      const bullet = this.world.getBulletById(bulletData.id)
      if (bullet) {
        bullet.syncToNetworkData(bulletData)
      } else {
        const bullet = new Bullet(bulletData.id, Vector2.fromObject(bulletData.pos), Vector2.fromObject(bulletData.speed), bulletData.ownerId)
        this.world.addEntity(bullet)
      }
    }

    // remove dead bullets
    for (const bullet of this.world.getBullets()) {
      if (!state.bullets.find(b => b.id === bullet.id)) {
        this.world.removeEntity(bullet)
      }
    }

    // remove disconnected players
    for (const ship of this.world.getShips()) {
      if (!ships.find(p => p.id === ship.id)) {
        this.world.removeEntity(ship)
      }
    }

  }

  onPlayerStats(state) {
    const players = state.players
    // update players
    for (const playerData of players) {
      var player = this.world.getPlayerById(playerData.id)
      if (player) {
        player.syncToNetworkData(playerData)
      } else {
        player = this.world.addPlayer(playerData.id, playerData.name)
        if (playerData.id === this.socket.id) {
          player.isCurrentPlayer = true
        }
      }
    }

    // remove disconnected players
    for (const player of this.world.getPlayers()) {
      if (!players.find(p => p.id === player.id)) {
        this.world.removePlayer(player)
      }
    }
  }
}

const client = new Client(window) // Initialize the client