// pages/api/socket.ts
//import { PORT } from '@/config/app'
import type { NextApiRequest } from 'next'
import { Server } from 'socket.io'
import { NextResponse } from 'next/server'

export const config = {
  api: {
    bodyParser: false,
  },
}

import { NextApiResponseWithSocket } from '@/types/socket'

const PORT = Number(process.env.SOCKET_PORT) || 3000
export let io: Server

export async function GET(
  _req: NextApiRequest,
  res: NextApiResponseWithSocket,
) {
  console.log('Starting Socket.IO server on port:', PORT + 1)

  io = new Server({
    path: '/api/socket',
    addTrailingSlash: false,
    cors: { origin: '*' },
  }).listen(PORT + 1)

  io.on('connect', (socket) => {
    const _socket = socket
    console.log('socket connect', socket.id)
    _socket.broadcast.emit('welcome', `Welcome ${_socket.id}`)
    socket.on('disconnect', async () => {
      console.log('socket disconnect')
    })
  })

  return NextResponse.json({
    success: true,
    message: 'Socket is started',
    socket: `:${PORT + 1}`,
  })
}
