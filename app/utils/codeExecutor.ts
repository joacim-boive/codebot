import axios from 'axios'

interface ExecutionResult {
  data: { errors?: { type: string; error: string }[] }
}

export async function executeCode(code: string) {
  const pattern =
    /\/\/FILENAME: (\w+\.(tsx|ts))\n```(tsx|typescript)\n([\s\S]*?)\n```/g
  const files = []
  let executionResults: ExecutionResult = { data: { errors: [] } }
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

  const { data } = executionResults
  return data
}
