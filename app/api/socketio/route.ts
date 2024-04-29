import SocketHandler from '@/lib/socket'
import { NextResponse } from 'next/server'

export const GET = () => {
  SocketHandler()

  return NextResponse.json({
    success: true,
  })
}
