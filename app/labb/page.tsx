'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

export default function Home() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          variant: 'destructive',
          open: true,
          onOpenChange: () => setOpen(true),
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem with your request.',
        })
      }}
    >
      Show Toast
    </Button>
  )
}
