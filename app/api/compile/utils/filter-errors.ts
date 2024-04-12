import { filterTS2307 } from './errors/ts2703'

// Function to filter TS2307 errors
export const filterErrors = (errorString: string) => {
  const errors = filterTS2307(errorString)
  return errors // Combine back into a string
}
