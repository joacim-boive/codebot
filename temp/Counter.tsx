import { Signal, signal } from '@preact/signals-react'

export const Counter = () => {
  const count: Signal<number> = signal(0)

  const increment = () => {
    count.value++
  }

  const decrement = () => {
    count.value--
  }

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  )
}
