import { Signal } from '@preact/signals-react'

type ChildComponentProps = {
  count: Signal<number>
}

export const ChildComponent = ({ count }: ChildComponentProps) => {
  return (
    <div>
      <h2>Child Component</h2>
      <p>Count from Parent: {count}</p>
    </div>
  )
}
