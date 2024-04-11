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

    // const response = {
    //   id: 'msg_018ekvLsZ4TbEsA9g1TLqHnN',
    //   type: 'message',
    //   role: 'assistant',
    //   content: [
    //     {
    //       type: 'text',
    //       text: "Here are two React components where one imports the other and uses a custom hook to retrieve data:\n\n//FILENAME: useUserData.ts\n```typescript\nimport { useState, useEffect } from 'react';\n\ntype User = {\n  id: number;\n  name: string;\n  email: string;\n};\n\nconst useUserData = () => {\n  const [users, setUsers] = useState<User[]>([]);\n\n  useEffect(() => {\n    const fetchUsers = async () => {\n      try {\n        const response = await fetch('https://jsonplaceholder.typicode.com/users');\n        const data = await response.json();\n        setUsers(data);\n      } catch (error) {\n        console.error('Error fetching users:', error);\n      }\n    };\n\n    fetchUsers();\n  }, []);\n\n  return users;\n};\n\nexport default useUserData;\n```\n\n//FILENAME: UserList.tsx\n```tsx\nimport { FC } from 'react';\nimport useUserData from './useUserData';\n\nconst UserList2: FC = () => {\n  const users = useUserData();\n\n  return (\n    <div>\n      <h2>User List</h2>\n      {users.map((user) => (\n        <div key={user.id}>\n          <p>Name: {user.name}</p>\n          <p>Email: {user.email}</p>\n        </div>\n      ))}\n    </div>\n  );\n};\n\nexport default UserList;\n```\n\n//FILENAME: App.tsx\n```tsx\nimport UserList from './UserList';\n\nconst App = () => {\n  return (\n    <div>\n      <h1>My App</h1>\n      <UserList />\n    </div>\n  );\n};\n\nexport default App;\n```\n\nIn this example, we have three files:\n\n1. `useUserData.ts`: This file defines a custom hook called `useUserData` that fetches user data from an API endpoint using the `fetch` function. It uses the `useState` and `useEffect` hooks to manage the state of the fetched data. The `useUserData` hook returns the `users` state variable.\n\n2. `UserList.tsx`: This component imports the `useUserData` hook and uses it to retrieve the user data. It renders a list of user names and emails by mapping over the `users` array.\n\n3. `App.tsx`: This is the main component that renders the `UserList` component.\n\nThe `App` component imports the `UserList` component, and the `UserList` component, in turn, imports and uses the `useUserData` custom hook to fetch and display the user data.\n\nThis example demonstrates how to structure components, use custom hooks for data retrieval, and import dependencies between components.",
    //     },
    //   ],
    //   model: 'claude-3-opus-20240229',
    //   stop_reason: 'end_turn',
    //   stop_sequence: null,
    //   usage: {
    //     input_tokens: 401,
    //     output_tokens: 652,
    //   },
    // }

    //console.log(JSON.stringify(response, null, 2))

    // // // Extract the suggested code from the response
    const suggestedCode = response.content.slice(-1)[0].text

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
