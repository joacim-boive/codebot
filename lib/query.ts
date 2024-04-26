import { Anthropic } from '@anthropic-ai/sdk'
import db from '@/app/database'

type MessageAi = {
  role: 'assistant' | 'user'
  content: string
}

export type ResponseAI = {
  role: 'assistant'
  content: string
  error?: string
}

type Prompt = {
  content: string
  conversationId: number
}

export const query = async ({
  content,
  conversationId = 1,
}: Prompt): Promise<ResponseAI | Error> => {
  try {
    // Load the conversation history from the database
    const conversationHistory: MessageAi[] = await getConversationHistory(
      conversationId,
      content,
    )

    const response = await getAiResponse(conversationHistory, conversationId)
    return response
  } catch (error: unknown) {
    console.error('Error communicating with AI API:', error)
    return {
      role: 'assistant',
      content: 'Error communicating with AI API',
      error: (error as Error).message,
    }
  }
}

/**
 * Retrieves the conversation history for a given conversation ID and adds the user's message to it.
 *
 * @param {number} conversationId - The ID of the conversation.
 * @param {string} content - The content of the user's message.
 * @return {Promise<MessageAi[]>} - A promise that resolves to an array of MessageAi objects representing the conversation history.
 */
const getConversationHistory = async (
  conversationId: number,
  content: string,
): Promise<MessageAi[]> => {
  const conversationHistory: MessageAi[] = await db('conversations')
    .where({ conversationId })
    .select('role', 'content')

  // Add the user's message to the conversation history
  await db('conversations').insert({
    role: 'user',
    content,
    conversationId,
  })

  //Add the new message
  conversationHistory.push({ role: 'user', content })

  console.log(JSON.stringify(conversationHistory, null, 2))
  return conversationHistory
}

/**
 * Retrieves the AI response based on the current question and includes the conversation history for context. The result is stored in database with the corresponding conversation ID.
 *
 * @param {MessageAi[]} conversationHistory - The history of messages in the conversation.
 * @param {number} conversationId - The ID of the conversation.
 * @return {ResponseAI} The AI response object containing the assistant's role and suggested code.
 */
async function getAiResponse(
  conversationHistory: MessageAi[],
  conversationId: number,
): Promise<ResponseAI> {
  const {
    MODEL = 'claude-3-opus-20240229',
    MAX_TOKENS = 1024,
    SYSTEM_PROMPT = '',
  } = process.env
  const client = new Anthropic()

  const response = await client.messages.create({
    model: MODEL,
    system: SYSTEM_PROMPT,
    max_tokens: Number(MAX_TOKENS),
    messages: conversationHistory,
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
}
