/* eslint-disable react/prop-types */
/* eslint-disable react/no-children-prop */
'use client'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { executeCode } from './utils/codeExecutor'
import { Textarea } from '@/components/ui/textarea'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { PropagateLoader } from 'react-spinners'
import { motion } from 'framer-motion'
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown) // Clean up
  }, [])

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
    let data = await executeCode(suggestedCode)
    let retries = 0

    if ((data?.errors ?? []).length > 0) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content: `Seems as my code wasn't entirely up to standards - trying again...`,
        },
      ])
    }

    let retryResponse
    while ((data?.errors ?? []).length > 0 && retries < 3) {
      retries++

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content: data.errors?.map((error) => error.error)?.join(', ') ?? '',
        },
      ])

      retryResponse = await axios.post<{ suggestedCode: string }>(
        '/api/claude',
        {
          message: `There was an issue with your code suggestion. Please try and write valid code this time without any errors. Attempt ${retries}/3: ${data.errors?.map((error) => error.error)?.join(', ') ?? ''}`,
        },
      )
      const { suggestedCode } = retryResponse.data

      // Execute the suggested code and validate the output
      data = await executeCode(suggestedCode)
    }

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
    <>
      <style>{`
        pre {
          overflow-x: auto;
          white-space: pre-wrap;
        }
      `}</style>
      {/* This is so that code examples doesn't break out of the layout */}

      <div className="container mx-auto p-4 max-w-4xl mb-3">
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
        <Card className="mb-10 border-0 shadow-none">
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
                <pre
                  className={`px-4 py-2 shadow-md rounded-lg max-w-[95%] ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  } ${message.role === 'assistant' ? 'ml-4' : ''}`}
                >
                  <Markdown
                    // eslint-disable-next-line react/no-children-prop
                    children={message.content}
                    components={{
                      code(props) {
                        const { children, className, ...rest } = props
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <SyntaxHighlighter
                            {...rest}
                            PreTag="div"
                            children={String(children).replace(/\n$/, '')}
                            language={match[1]}
                            style={a11yDark}
                          />
                        ) : (
                          <code {...rest} className={className}>
                            {children}
                          </code>
                        )
                      },
                    }}
                  />
                </pre>
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
          className="flex flex-col items-center w-full"
        >
          <Textarea
            required
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Please submit your request for greatness here"
            className="w-full mb-2"
          />
          <Button type="submit" className="w-full">
            Send
          </Button>
        </form>
      </div>
    </>
  )
}
