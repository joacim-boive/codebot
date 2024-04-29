import { Signal, signal, effect } from '@preact/signals-react'
import { useLocation, useNavigate } from 'react-router-dom'

export const SignalInUrl = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)

  const count: Signal<number> = signal(
    parseInt(searchParams.get('count') || '0', 10),
  )

  const increment = () => {
    count.value++
    updateUrlParam('count', count.value.toString())
  }

  const updateUrlParam = (key: string, value: string) => {
    searchParams.set(key, value)
    navigate(`?${searchParams.toString()}`)
  }

  effect(() => {
    updateUrlParam('count', count.value.toString())
  })

  return (
    <div>
      <h1>Signal in URL</h1>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}
