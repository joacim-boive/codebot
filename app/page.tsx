/* eslint-disable react/prop-types */
/* eslint-disable react/no-children-prop */
'use client'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
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
import io, { Socket } from 'socket.io-client'
import {
  CLIENT_SUBMIT_QUESTION,
  SERVER_COMPILE_PROGRESS,
  SERVER_ERROR,
  SERVER_RETURN_QUESTION_ANSWER,
} from '@/lib/event-names'
import { useToast } from '@/components/ui/use-toast'

const messageVariants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
}

type SocketEvent = {
  messageType: typeof CLIENT_SUBMIT_QUESTION
  content: string
}

type VariantColors = {
  bg: string
  text: string
}

const variantColorMapping: Record<
  NonNullable<Message['variant']>,
  VariantColors
> = {
  info: { bg: 'bg-green-200', text: 'text-green-800' },
  error: { bg: 'bg-red-200', text: 'text-red-800' },
  success: { bg: 'bg-gray-200', text: 'text-gray-800' },
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const containerRef = useRef<HTMLFormElement>(null)
  const conversationId = 1 //TODO handle multiple conversations
  const socketRef = useRef<Socket | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const initializeSocket = async () => {
      if (!socketRef.current) {
        await socketInitializer()
      }
    }

    initializeSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const socketInitializer = async () => {
    //Trigger the start of socker server
    try {
      await fetch('/api/socketio')
    } catch (error) {
      console.error('Error initializing socket:', error)
      toast({
        title: 'Error initializing socket',
        description: 'Please try again later',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    socketRef.current = io('http://localhost:3001', {
      path: '/api/socketio',
      transports: ['websocket'], // Force WebSocket
    })

    socketRef.current.onAny((event, ...args) => {
      console.log(event, args)
    })

    socketRef.current.on('welcome', () => {
      setIsConnected(true)
      toast({ variant: 'default', description: 'Socket connected' })
    })

    socketRef.current.on(SERVER_RETURN_QUESTION_ANSWER, (data: Message) => {
      setMessages((prevMessages) => [...prevMessages, data])

      setIsLoading(!!data.isPending)
      setUserInput('')
    })

    socketRef.current.on(SERVER_COMPILE_PROGRESS, (data: Message) => {
      setMessages((prevMessages) => [...prevMessages, data])
    })

    socketRef.current.on(SERVER_ERROR, (data: Message) => {
      setMessages((prevMessages) => [...prevMessages, data])
      setIsLoading(false)
      toast({
        title: 'Error',
        description: data.content,
        variant: 'destructive',
        duration: 5000,
      })
    })
  }

  const sendEvent = ({ messageType, content }: SocketEvent) => {
    if (socketRef.current) {
      socketRef.current.emit(messageType, { content })
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const formEvent = new Event('submit', {
          bubbles: true,
          cancelable: true,
        })
        handleSubmit(formEvent)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown) // Clean up
  }, [userInput])

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

  const handleSubmit = async (e: React.FormEvent | Event) => {
    e?.preventDefault()
    setIsLoading(true)

    // Add user's input to the messages
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: userInput, variant: 'info' },
    ])

    sendEvent({
      messageType: CLIENT_SUBMIT_QUESTION,
      content: userInput,
    })
  }

  let colorClasses

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
        <p>
          Socket connection status: {isConnected ? 'Connected' : 'Disconnected'}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: 'Uh oh! Something went wrong.',
              description: 'There was a problem with your request.',
            })
          }}
        >
          Show Toast
        </Button>
        <Card className="mb-10 border-0 shadow-none">
          <div className="space-y-4">
            {messages.map((message, index) => {
              colorClasses = variantColorMapping[message.variant] || {
                bg: 'bg-gray-200',
                text: 'text-gray-800',
              }
              return (
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
                  className={`flex ${message.role === 'user' ? 'justify-start pt-5' : 'justify-end'}`}
                >
                  <pre
                    className={`px-4 py-2 shadow-md rounded-lg max-w-[95%] ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : `${colorClasses.bg} ${colorClasses.text}`
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
              )
            })}

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
