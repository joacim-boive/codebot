// ChatInput.tsx
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'

type ChatInputProps = {
  onSubmit: (userInput: string) => void
}

export const ChatInput = ({ onSubmit }: ChatInputProps) => {
  const [userInput, setUserInput] = useState('')

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

  const handleSubmit = (e: React.FormEvent | Event) => {
    e?.preventDefault()
    onSubmit(userInput)
    setUserInput('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
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
  )
}
