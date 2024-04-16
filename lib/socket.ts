// lib/socket.ts
import { Server, Socket } from 'socket.io'
import {
  CLIENT_SUBMIT_QUESTION,
  SERVER_RETURN_QUESTION_ANSWER,
} from '@/lib/eventNames'
import { setupDatabase } from '@/app/database'
import { queryAi } from '@/lib/queryAi'

type AllowedEvents = 'welcome' | typeof SERVER_RETURN_QUESTION_ANSWER

type Response = {
  role: 'assistant'
  content: string
  variant?: 'default' | 'info' | 'warning' | 'error'
}

type SocketEvent = {
  socket: Socket
  event: AllowedEvents
  response: Response
}

const PORT = Number(process.env.SOCKET_PORT) || 3001
export let io: Server

const emitEvent = ({ socket, event, response }: SocketEvent) => {
  socket.broadcast.emit(event, response)
}

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

    io.on('connect', async (socket: Socket) => {
      console.log('socket connect', socket.id)

      await setupDatabase()

      emitEvent({
        socket,
        event: 'welcome',
        response: { role: 'assistant', content: 'Welcome' },
      })

      socket.on('disconnect', async () => {
        console.log('socket disconnect')
      })

      socket.on(CLIENT_SUBMIT_QUESTION, async ({ content }) => {
        const result = await queryAi({
          content,
          conversationId: 1,
        })

        // Type guard to check if the result is of type { error: string; }
        if ('error' in result) {
          console.error('Error from queryAi:', result.error)
          // Handle the error case here
          return
        }

        // At this point, TypeScript knows that result is of type { role: string; content: string; }
        const { content: data } = result as { role: string; content: string }

        emitEvent({
          socket,
          event: SERVER_RETURN_QUESTION_ANSWER,
          response: {
            content: 'This is the first attempt',
            role: 'assistant',
            variant: 'info',
          },
        })

        emitEvent({
          socket,
          event: SERVER_RETURN_QUESTION_ANSWER,
          response: {
            content: data,
            role: 'assistant',
          },
        })

        //socket.broadcast.emit(SERVER_RETURN_QUESTION_ANSWER, data)
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
