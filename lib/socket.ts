// lib/socket.ts
import { Server, Socket } from 'socket.io'

const PORT = Number(process.env.SOCKET_PORT) || 3000
export let io: Server

export default function SocketHandler() {
  if (!io) {
    io = new Server({
      addTrailingSlash: false,
      path: '/api/socketio',
      cors: {
        origin: 'http://localhost:3000', // Allow your Next.js frontend's origin
        methods: ['GET', 'POST'],
      },
    }).listen(PORT + 1)

    io.on('connect', (socket: Socket) => {
      console.log('socket connect', socket.id)

      socket.broadcast.emit('welcome', `Welcome ${socket.id}`)
      socket.on('disconnect', async () => {
        console.log('socket disconnect')
      })

      socket.on('eventName', (data) => {
        console.log('Received data:', data)
      })
    })
  }
}

/**
 * Configuration object for the Socket.IO server.
 *
 * @property {Object} api - Configuration for the API route.
 * @property {boolean} api.bodyParser - Disables the default NextJS body parser for the API route. This is necessary for Socket.IO because it handles its own message parsing.
 */
export const config = {
  api: {
    bodyParser: false,
  },
}
