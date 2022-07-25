import { Server, ServerOptions } from 'socket.io'
import { Server as HttpServer } from 'http'
import { UserAttributes } from '../types'
import formatMessage from './messages'
import { getCurrentUser, getRoomUsers, userJoin, userLeave } from './users'

export class SocketIOService {
  private static _instance: SocketIOService | undefined
  private static server: Server | undefined
  private static botName: string = 'ChatCord Bot'

  private constructor() {
    // Private constructor ensures singleton instance
  }

  static instance(): SocketIOService {
    if (!this._instance) {
      return new SocketIOService()
    }

    return this._instance
  }

  initialize(httpServer: HttpServer, opts?: Partial<ServerOptions>) {
    SocketIOService.server = new Server(httpServer, opts)

    SocketIOService.server.on('connection', (socket) => {
      console.log('SERVER CONNECTED!!')
      socket.on(
        'joinRoom',
        ({ username, room }: { username: string; room: string }) => {
          const user: UserAttributes = userJoin(socket.id, username, room)

          console.log(username)

          socket.join(user!.room!)

          // Welcome current user
          // socket.emit('message', {})

          // Broadcast when a user connects
          socket.broadcast.to(user!.room!).emit('message', {
            message: `${user!.username} has joined the chat`,
            username: user!.username,
            timestamp: new Date().getTime(),
          })

          // Send users and room info
          this.getServer()
            .to(user!.room!)
            .emit('roomUsers', {
              room: user.room,
              users: getRoomUsers(user!.room!),
            })
        }
      )

      // Listen for chatMessage
      socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        console.log(msg)

        this.getServer().to(user!.room!).emit('message', {
          message: msg,
          username: user!.username,
          timestamp: new Date().getTime(),
        })
      })

      // Runs when client disconnects
      socket.on('disconnect', () => {
        const user = userLeave(socket.id)

        if (user) {
          this.getServer()
            .to(user!.room!)
            .emit(
              'message',
              formatMessage(
                SocketIOService.botName,
                `${user.username} has left the chat`
              )
            )

          // Send users and room info
          this.getServer()
            .to(user!.room!)
            .emit('roomUsers', {
              room: user.room,
              users: getRoomUsers(user!.room!),
            })
        }
      })
    })

    return SocketIOService.server
  }

  ready() {
    return SocketIOService.server !== null
  }

  getServer(): Server {
    if (!SocketIOService.server) {
      throw new Error('IO server requested before initialization')
    }

    return SocketIOService.server
  }
  // sendMessage(roomId: string | string[], key: string, message: string) {
  //   this.getServer().to(roomId).emit(key, message)
  // }

  // emitAll(key: string, message: string) {
  //   this.getServer().emit(key, message)
  // }

  // getRooms() {
  //   return this.getServer().sockets.adapter.rooms
  // }
}
