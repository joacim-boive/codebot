// lib/socket.ts
import { Server, Socket } from 'socket.io'
import {
  CLIENT_SUBMIT_QUESTION,
  SERVER_RETURN_QUESTION_ANSWER,
  AllowedSocketEvents,
  SERVER_ERROR,
} from '@/lib/event-names'
import { setupDatabase } from '@/app/database'
import { ResponseAI, query } from '@/lib/query'
import { Message } from '@/types/messages'
import { compiler } from '@/app/utils/compiler/compiler'

type Response = Message & {
  role: 'assistant'
  isPending?: boolean
}

type SocketEvent = {
  socket: Socket
  event: AllowedSocketEvents
  response: Response
}

const PORT = Number(process.env.SOCKET_PORT) || 3001
export let io: Server

export const emitEvent = ({ socket, event, response }: SocketEvent) => {
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
        response: { role: 'assistant', content: 'Welcome', variant: 'info' },
      })

      socket.on('disconnect', async () => {
        console.log('socket disconnect')
      })

      socket.on(CLIENT_SUBMIT_QUESTION, async ({ content }) => {
        const result = await query({
          content,
          conversationId: 1,
        })

        if ('error' in result) {
          console.error('Error from queryAi:', result.error)
          emitEvent({
            socket,
            event: SERVER_ERROR,
            response: {
              content: result.error as string,
              role: 'assistant',
              variant: 'error',
            },
          })
          return
        }

        if ('content' in result) {
          const { content: data } = result

          emitEvent({
            socket,
            event: SERVER_RETURN_QUESTION_ANSWER,
            response: {
              content: data,
              role: 'assistant',
              variant: 'success',
            },
          })

          emitEvent({
            socket,
            event: SERVER_RETURN_QUESTION_ANSWER,
            response: {
              content:
                'Im now validating the code against your code standards and best practices...',
              role: 'assistant',
              variant: 'info',
              isPending: true,
            },
          })

          // // Execute the suggested code and validate the output
          let errors = await compiler(socket, data)
          let retries = 0

          if ((errors ?? []).length > 0) {
            emitEvent({
              socket,
              event: SERVER_RETURN_QUESTION_ANSWER,
              response: {
                content: `Seems as my code wasn't entirely up to standards - trying again...`,
                role: 'assistant',
                variant: 'error',
                isPending: true,
              },
            })
          }

          while ((errors ?? []).length > 0 && retries < 3) {
            retries++

            emitEvent({
              socket,
              event: SERVER_RETURN_QUESTION_ANSWER,
              response: {
                content: errors?.map((error) => error.error)?.join(', ') ?? '',
                role: 'assistant',
                variant: 'error',
                isPending: true,
              },
            })

            const retry = await query({
              content: `There was an issue with your code suggestion. Please try and write valid code this time without any errors. Attempt ${retries}/3: ${errors?.map((error) => error.error)?.join(', ') ?? ''}`,
              conversationId: 1,
            })

            // Type guard to check if the result is of type { error: string; }
            if ('error' in result) {
              console.error('Error from queryAi:', result.error)
              emitEvent({
                socket,
                event: SERVER_ERROR,
                response: {
                  content: data,
                  role: 'assistant',
                  variant: 'error',
                },
              })
              return
            } else {
              errors = await compiler(
                socket,
                retry as unknown as ResponseAI['content'],
              )
            }
          }

          if ((errors ?? []).length > 0) {
            emitEvent({
              socket,
              event: SERVER_RETURN_QUESTION_ANSWER,
              response: {
                content: `Despite my best efforts it seems there are still some errors in my code you need to rectify.`,
                role: 'assistant',
                variant: 'error',
                isPending: false,
              },
            })
          } else {
            emitEvent({
              socket,
              event: SERVER_RETURN_QUESTION_ANSWER,
              response: {
                content: `I have successfully validated your code and it seems to be up to standards.`,
                role: 'assistant',
                variant: 'success',
                isPending: false,
              },
            })
          }
        }
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
