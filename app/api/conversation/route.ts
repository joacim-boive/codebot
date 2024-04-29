import { NextResponse } from 'next/server'
import db, { setupDatabase } from '@/app/database'
import { Message } from '@/types/messages'

export async function POST(request: Request) {
  const { conversationId = 1 } = await request.json()
  //TODO break this out inte a middleware maybe
  await setupDatabase()
  try {
    // Load the conversation history from the database
    const conversationHistory: Message[] = await db('conversations')
      .where({ conversationId })
      .select('role', 'content', 'extra')

    return NextResponse.json({
      conversationHistory,
    })
  } catch (error) {
    console.error(error)
  }
}
