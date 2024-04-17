import { Anthropic } from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import db from '@/app/database'
import { Message } from '@/types/messages'

type ChatPrompt = {
  messages: Message[]
}

type Prompt = {
  content: string
  conversationId: number
}

const {
  MODEL = 'claude-3-opus-20240229',
  MAX_TOKENS = 1024,
  SYSTEM_PROMPT = '',
} = process.env

const client = new Anthropic()

export const queryAi = async ({ content, conversationId = 1 }: Prompt) => {
  try {
    // Load the conversation history from the database
    const conversationHistory: Message[] = await db('conversations')
      .where({ conversationId })
      .select('role', 'content')
      .orderBy('timestamp')

    // Add the user's message to the conversation history
    await db('conversations').insert({
      role: 'user',
      content,
      conversationId,
    })

    //Add the new message
    conversationHistory.push({ role: 'user', content, variant: 'info' })

    console.log(JSON.stringify(conversationHistory, null, 2))
    // Create a chat prompt with the entire conversation history
    const prompt: ChatPrompt = {
      messages: conversationHistory,
    }

    //Send the prompt to the Claude API using the Anthropic SDK
    const response = await client.messages.create({
      model: MODEL,
      system: SYSTEM_PROMPT,
      max_tokens: Number(MAX_TOKENS),
      messages: prompt.messages,
    })

    //Extract the suggested code from the response
    const suggestedCode = response.content.slice(-1)[0].text

    console.log(JSON.stringify(suggestedCode, null, 2))

    // Add the assistant's response to the conversation history
    await db('conversations').insert({
      role: 'assistant',
      content: suggestedCode,
      conversationId,
    })

    // Return the suggested code
    return { role: 'assistant', content: suggestedCode }
  } catch (error) {
    console.error('Error communicating with Claude API:', error)
    return NextResponse.json(
      { error: 'Failed to communicate with Claude API' },
      { status: 500 },
    )
  }
}
