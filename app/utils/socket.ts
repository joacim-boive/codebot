import { io } from 'socket.io-client'

export const socketClient = () => {
  const socket = io(`:${Number(process.env.SOCKET_PORT) + 1 || 3000}`, {
    path: '/api/socket',
    addTrailingSlash: false,
  })

  socket.on('connect', () => {
    console.log('Connected')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected')
  })

  socket.on('connect_error', async (err) => {
    console.log(`connect_error due to ${err.message}`)
    //await fetch('/api/socket')
  })

  return socket
}
