export async function extractCodeFiles(code: string) {
  const pattern =
    /\/\/FILENAME: (\w+\.(tsx|ts))\n```(tsx|typescript)\n([\s\S]*?)\n```/g
  const files = []
  let match

  while ((match = pattern.exec(code)) !== null) {
    const filename = match[1]
    const code = match[4]
    files.push({ filename, code })
  }

  //No code to process
  if (files && files?.length < 1) return

  return files
}
