// pages/api/compile.ts
import { execSync } from 'child_process'
import { spawnSync } from 'child_process'
import { join } from 'path'
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { NextResponse } from 'next/server'

interface ExecError extends Error {
  stderr: Buffer
  output?: Buffer[]
  status?: number
}

type Errors = {
  type: 'TYPESCRIPT' | 'ESLINT' | 'PRETTIER'
  error?: string
  systemError?: string
}

export async function POST(req: Request) {
  const files = await req.json()

  // Get the path to the temp directory in your project
  const tempDirPath = join(process.cwd(), 'temp')

  // Create the temp directory if it doesn't exist
  if (!existsSync(tempDirPath)) {
    mkdirSync(tempDirPath)
  }

  // Write the code to a temporary file in the temp directory
  for (const file of files) {
    const { filename, code } = file
    const tempFilePath = join(tempDirPath, filename)
    writeFileSync(tempFilePath, code)
  }

  const errors: Errors[] = []

  try {
    execSync('npx prettier --write .', { cwd: './temp' })
  } catch (error) {
    const execError = error as ExecError

    if (execError.status !== 0) {
      errors.push({
        type: 'PRETTIER',
        error: (execError.output as Buffer[])[1].toString(),
      })
    }

    console.error(`execSync error: ${error}`)
  }

  try {
    const stdout = execSync('npx tsc', { cwd: './temp' })
    console.log(`stdout: ${stdout.toString()}`)
  } catch (error) {
    const execError = error as ExecError

    if (execError.status !== 0) {
      errors.push({
        type: 'TYPESCRIPT',
        error: (execError.output as Buffer[])[1].toString(),
      })
    } else {
      console.error(`typescript error: ${error}`)
      errors.push({
        type: 'TYPESCRIPT',
        systemError: (error as ExecError).stderr.toString(),
      })
    }

    console.error(`execSync error: ${error}`)
  }

  try {
    // Run ESlint on all the files in the tempDirPath

    //TODO - Run yarn run eslint --fix first on the files to remove formatting errors.
    const eslintResult = spawnSync('yarn', ['eslint', tempDirPath], {
      encoding: 'utf8',
    })

    if (eslintResult.status !== 0) {
      errors.push({
        type: 'ESLINT',
        error: (eslintResult.output as unknown as Buffer[])[1].toString(),
      })
    }
  } catch (error) {
    console.error(`eslint error: ${error}`)
    errors.push({
      type: 'ESLINT',
      systemError: (error as ExecError).stderr.toString(),
    })
  }

  // Clean up the temporary file
  //unlinkSync(tempFilePath)

  const result = { errors }

  if (errors.length > 0) {
    result.errors = errors
  }

  return NextResponse.json({
    result,
  })
}
