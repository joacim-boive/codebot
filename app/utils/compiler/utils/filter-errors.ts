import { filterTS2307 } from './errors/ts2703'

// Function to filter TS2307 errors
export const filterErrors = (errorString: string) => {
  const errorsArray: string[] = errorString.split('\n') // Split into array of individual errors

  const filteredErrors = filterTS2307(errorsArray)

  return filteredErrors.join('\n') // Combine back into a string
}
