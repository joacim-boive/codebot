'use client'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { executeCode, modifyCode } from './utils/codeExecutor'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { PropagateLoader } from 'react-spinners'
import { motion } from 'framer-motion'
import Markdown from 'react-markdown'
import { Message } from '@/types/messages'

const messageVariants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const containerRef = useRef<HTMLFormElement>(null)
  const conversationId = 1 //TODO handle multiple conversations

  useEffect(() => {
    setIsLoading(true)

    const fetchData = async () => {
      const response = await axios.post<{ conversationHistory: Message[] }>(
        '/api/conversation',
        {
          conversationId,
        },
      )
      const { conversationHistory } = response.data

      setMessages(conversationHistory)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    const scrollToBottom = () => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({
          behavior: 'smooth',
        })
      }
    }

    if (messages.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 0)
      })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Add user's input to the messages
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: userInput },
    ])

    // Send the user's input to the Claude API
    const response = await axios.post<{ suggestedCode: string }>(
      '/api/claude',
      { message: userInput },
    )
    const { suggestedCode } = response.data

    // Execute the suggested code and validate the output
    const executionResult = await executeCode(suggestedCode)

    console.log(executionResult)

    // If there are errors, modify the code and re-execute until successful
    // while (executionResult.errors.length > 0) {
    //   const modifiedCode = modifyCode(suggestedCode, executionResult.errors);
    //   executionResult = executeCode(modifiedCode);
    // }

    // Add the validated code to the messages
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'assistant', content: suggestedCode },
    ])

    // Clear the user input
    setUserInput('')
    setIsLoading(false)
  }

  return (
    <div
      className="container mx-auto p-4 max-w-3xl overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 2rem)' }}
    >
      <div className="flex flex-col items-center">
        <Image
          priority={false}
          loading="lazy"
          src="/codebot.png"
          alt="Codebot logo"
          width={200}
          height={200}
        />

        <h1 className="text-4xl font-bold animate-pulse">Codebot 0.1</h1>
      </div>
      <Card className="mb-12 border-0 shadow-none">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              layout
              initial="initial"
              animate="animate"
              variants={messageVariants}
              transition={{
                opacity: { duration: 0.5 },
                scale: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
              }}
              className={`flex ${
                message.role === 'user' ? 'justify-start pt-5' : 'justify-end'
              }`}
            >
              <div
                className={`px-4 py-2 shadow-md rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                } ${message.role === 'assistant' ? 'ml-4' : ''}`}
              >
                <Markdown>{message.content}</Markdown>
              </div>
            </motion.div>
          ))}

          <div className="flex justify-center items-end flex-grow">
            <PropagateLoader loading={isLoading} color="#556365" />
          </div>
        </div>
      </Card>
      <form
        ref={containerRef}
        onSubmit={handleSubmit}
        className="flex space-x-2"
      >
        <Input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your code snippet"
          className="flex-grow"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}
