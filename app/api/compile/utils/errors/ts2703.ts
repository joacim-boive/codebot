// Function to filter TS2307 errors
// We filter out any errors that are of this nature:
// ChatInput.tsx(2,24): error TS2307: Cannot find module 'socket.io-client' or its corresponding type declarations.

// This is because the AI might suggest modules that we haven't imported into our project and that's not an error per say.

export const filterTS2307 = (errorArray: string[]) => {
  const filteredErrors = errorArray.filter(
    (error) => error && !error.includes('TS2307'),
  )

  return filteredErrors
}
