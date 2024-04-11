import axios from 'axios'

interface ExecutionResult {
  code: string
  filename: string
  errors: string[]
}

export async function executeCode(code: string) {
  const pattern = /\/\/FILENAME: (\w+\.(tsx|ts))\n```(tsx|ts)\n([\s\S]*?)\n```/g
  const files = []

  let executionResults: ExecutionResult[] = []
  let match

  while ((match = pattern.exec(code)) !== null) {
    const filename = match[1]
    const code = match[4]
    files.push({ filename, code })
  }
  //No code to process
  if (files && files?.length < 1)
    return {
      code: '',
      filename: '',
      errors: [],
    }

  if (files) {
    executionResults = await axios.post('/api/compile', files)
  }

  return executionResults
}

export function modifyCode(code: string, errors: string[]): string {
  // Analyze the errors and modify the code accordingly
  // Return the modified code
  // Placeholder implementation
  return code
}
