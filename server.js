const express = require('express')
const app = express()

// socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/client/index.html')
})

// server ticker
// setInterval(() => {}, 15)

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

