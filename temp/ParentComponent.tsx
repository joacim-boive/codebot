import { Signal, signal } from '@preact/signals-react'
import { ChildComponent } from './ChildComponent'

export const ParentComponent = () => {
  const count: Signal<number> = signal(0)

  const increment = () => {
    count.value++
  }

  return (
    <div>
      <h1>Parent Component</h1>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <ChildComponent count={count} />
    </div>
  )
}
