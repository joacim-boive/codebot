// pages/api/compile.ts
import { execSync } from 'child_process'
import { spawnSync } from 'child_process'
import { join } from 'path'
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { NextResponse } from 'next/server'
import { copyTsconfig } from '@/app/api/compile/utils/copy-tsconfig'
import { filterErrors } from './utils/filter-errors'
import { NextApiResponseWithSocket } from '@/types/socket'
import { io } from '@/app/api/socket/route'

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

type CompilerConfig = {
  errors: Errors[]
  type: 'TYPESCRIPT' | 'ESLINT'
  tempDirPath: string
}

const compile = ({ type, errors, tempDirPath }: CompilerConfig) => {
  const command = {
    TYPESCRIPT: 'tsc',
    ESLINT: 'eslint',
  }

  try {
    const result = spawnSync('npx', [command[type]], {
      cwd: tempDirPath, // Set the current working directory to tempDirPath
      encoding: 'utf8', // Set the encoding to 'utf8' to handle output as a string
    })

    if (result.status !== 0) {
      const filteredErrors = filterErrors(
        (result.output as unknown as Buffer[])[1].toString(),
      )

      if (filteredErrors.length > 0) {
        errors.push({
          type,
          error: filteredErrors,
        })
      }
    }
  } catch (error) {
    console.error(`${type} error: ${error}`)
    errors.push({
      type,
      systemError: (error as ExecError).stderr.toString(),
    })
  }

  return errors
}

export async function POST(req: Request, res: NextApiResponseWithSocket) {
  // Get the path to the temp directory in your project
  const tempDirPath = join(process.cwd(), 'temp')
  const files = await req.json()
  const errors: Errors[] = []

  //This isn't async
  copyTsconfig()

  // Create the temp directory if it doesn't exist
  if (!existsSync(tempDirPath)) {
    mkdirSync(tempDirPath)
  }

  // Write the code to temporary file(s) in the temp directory
  for (const file of files) {
    const { filename, code } = file
    const tempFilePath = join(tempDirPath, filename)
    writeFileSync(tempFilePath, code)

    io.emit('message', `writing file: ${filename}`)

    console.log(`Wrote ${filename} to ${tempFilePath}`)
    console.log(`Code: ${code}`)
  }

  // First we need to run prettier on all files to avoid prettier linting errors - where possible.
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

  compile({
    type: 'TYPESCRIPT',
    errors,
    tempDirPath,
  })

  compile({
    type: 'ESLINT',
    errors,
    tempDirPath,
  })

  // Clean up the temporary file
  //unlinkSync(tempFilePath)

  console.log(JSON.stringify(errors, null, 2))

  return NextResponse.json({
    errors,
  })
}
