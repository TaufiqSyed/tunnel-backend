import http from 'http'
import express from 'express'
import { SocketIOService } from './utils/socket-io-service'

const app = express()
const server = http.createServer(app)
SocketIOService.instance().initialize(server, { cors: { origin: '*' } })

const port = '3001'
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

server.listen(port)

server.on('listening', () => {
  console.log(`Listening on port:: http://localhost:${port}/`)
})

export default server
