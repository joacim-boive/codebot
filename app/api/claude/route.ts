import { Anthropic } from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import db, { setupDatabase } from '@/app/database'
import { Message } from '@/types/messages'

type ChatPrompt = {
  messages: Message[]
}

const {
  MODEL = 'claude-3-opus-20240229',
  MAX_TOKENS = 1024,
  SYSTEM_PROMPT = '',
} = process.env
const client = new Anthropic()

export async function POST(request: Request) {
  const { message, conversationId = 1 } = await request.json()

  try {
    //TODO break this out inte a middleware maybe
    await setupDatabase()

    // Load the conversation history from the database
    const conversationHistory: Message[] = await db('conversations')
      .where({ conversationId })
      .select('role', 'content')
      .orderBy('timestamp')

    // Add the user's message to the conversation history
    await db('conversations').insert({
      role: 'user',
      content: message,
      conversationId,
    })

    //Add the new message
    conversationHistory.push({ role: 'user', content: message })

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

    //console.log(JSON.stringify(response, null, 2))

    // // // Extract the suggested code from the response
    const suggestedCode = response.content.slice(-1)[0].text

    // const suggestedCode =
    //   "Here's an advanced example of communication between React components and a Next.js server using WebSocket and Socket.IO:\n\nFirst, let's set up the server-side code:\n\n//FILENAME: server.ts\n```typescript\nimport { Server } from 'socket.io';\n\nconst ioHandler = (req: any, res: any) => {\n  if (!res.socket.server.io) {\n    console.log('Initializing Socket.IO');\n\n    const io = new Server(res.socket.server);\n\n    io.on('connection', (socket) => {\n      console.log('Client connected');\n\n      socket.on('message', (msg: string) => {\n        console.log('Received message:', msg);\n        io.emit('message', msg);\n      });\n\n      socket.on('disconnect', () => {\n        console.log('Client disconnected');\n      });\n    });\n\n    res.socket.server.io = io;\n  }\n  res.end();\n};\n\nexport const config = {\n  api: {\n    bodyParser: false,\n  },\n};\n\nexport default ioHandler;\n```\n\nNow, let's create the React components:\n\n//FILENAME: ChatInput.tsx\n```tsx\nimport { useState } from 'react';\nimport { Socket } from 'socket.io-client';\n\ntype ChatInputProps = {\n  socket: Socket;\n};\n\nconst ChatInput: React.FC<ChatInputProps> = ({ socket }) => {\n  const [message, setMessage] = useState('');\n\n  const sendMessage = () => {\n    if (message.trim()) {\n      socket.emit('message', message);\n      setMessage('');\n    }\n  };\n\n  return (\n    <div>\n      <input\n        type=\"text\"\n        value={message}\n        onChange={(e) => setMessage(e.target.value)}\n        placeholder=\"Type a message...\"\n      />\n      <button onClick={sendMessage}>Send</button>\n    </div>\n  );\n};\n\nexport default ChatInput;\n```\n\n//FILENAME: ChatMessages.tsx\n```tsx\nimport { useEffect, useState } from 'react';\nimport { Socket } from 'socket.io-client';\n\ntype ChatMessagesProps = {\n  socket: Socket;\n};\n\nconst ChatMessages: React.FC<ChatMessagesProps> = ({ socket }) => {\n  const [messages, setMessages] = useState<string[]>([]);\n\n  useEffect(() => {\n    const messageListener = (message: string) => {\n      setMessages((prevMessages) => [...prevMessages, message]);\n    };\n\n    socket.on('message', messageListener);\n\n    return () => {\n      socket.off('message', messageListener);\n    };\n  }, [socket]);\n\n  return (\n    <div>\n      {messages.map((msg, index) => (\n        <p key={index}>{msg}</p>\n      ))}\n    </div>\n  );\n};\n\nexport default ChatMessages;\n```\n\nFinally, let's put everything together in the main page component:\n\n//FILENAME: index.tsx\n```tsx\nimport { useEffect, useState } from 'react';\nimport { io, Socket } from 'socket.io-client';\nimport ChatInput from './ChatInput';\nimport ChatMessages from './ChatMessages';\n\nconst Home: React.FC = () => {\n  const [socket, setSocket] = useState<Socket | null>(null);\n\n  useEffect(() => {\n    const newSocket = io();\n    setSocket(newSocket);\n\n    return () => {\n      newSocket.close();\n    };\n  }, []);\n\n  return (\n    <div>\n      <h1>Chat App</h1>\n      {socket && (\n        <>\n          <ChatMessages socket={socket} />\n          <ChatInput socket={socket} />\n        </>\n      )}\n    </div>\n  );\n};\n\nexport default Home;\n```\n\nIn this example, we have a server-side `server.ts` file that sets up a Socket.IO server. It listens for WebSocket connections and handles incoming messages by broadcasting them to all connected clients.\n\nOn the client-side, we have three components:\n1. `ChatInput.tsx`: Renders an input field and a send button. It sends the user's message to the server using the `socket.emit()` method.\n2. `ChatMessages.tsx`:"

    // Add the assistant's response to the conversation history
    await db('conversations').insert({
      role: 'assistant',
      content: suggestedCode,
      conversationId,
    })

    // Return the suggested code
    return NextResponse.json({
      suggestedCode,
    })
  } catch (error) {
    console.error('Error communicating with Claude API:', error)
    return NextResponse.json(
      { error: 'Failed to communicate with Claude API' },
      { status: 500 },
    )
  }
}
