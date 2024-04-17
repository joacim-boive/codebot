export type Message = {
  role: 'user' | 'assistant'
  content: string
  variant: 'info' | 'error' | 'success'
}
