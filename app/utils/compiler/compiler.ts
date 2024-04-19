// pages/api/compile.ts
import { execSync } from 'child_process'
import { spawnSync } from 'child_process'
import { join } from 'path'
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { copyTsconfig } from '@/app/api/compile/utils/copy-tsconfig'
import { filterErrors } from './utils/filter-errors'
import { Socket } from 'socket.io'
import { emitEvent } from '@/lib/socket'
import { SERVER_COMPILE_PROGRESS } from '@/lib/event-names'
import { extractCodeFiles } from '../extract-code-files'

interface ExecutionResult {
  data: { errors?: { type: string; error: string }[] }
}

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

type Files = {
  filename: string
  code: string
}

export async function compiler(socket: Socket, code: string) {
  const tempDirPath = join(process.cwd(), 'temp')
  const errors: Errors[] = []
  const files: Files[] | undefined = await extractCodeFiles(code)

  //This isn't async
  copyTsconfig()

  // Create the temp directory if it doesn't exist
  if (!existsSync(tempDirPath)) {
    mkdirSync(tempDirPath)
  }

  if (files) {
    // Write the code to temporary file(s) in the temp directory
    for (const file of files) {
      const { filename, code } = file
      const tempFilePath = join(tempDirPath, filename)
      writeFileSync(tempFilePath, code)

      emitEvent({
        socket,
        event: SERVER_COMPILE_PROGRESS,
        response: {
          role: 'assistant',
          content: `Writing ${tempFilePath}`,
          variant: 'info',
        },
      })

      console.log(`Wrote ${filename} to ${tempFilePath}`)
      console.log(`Code: ${code}`)
    }
  } else {
    emitEvent({
      socket,
      event: SERVER_COMPILE_PROGRESS,
      response: {
        role: 'assistant',
        content: `No files to compile`,
        variant: 'info',
      },
    })

    return
  }

  // First we need to run prettier on all files to avoid prettier linting errors - where possible.
  try {
    emitEvent({
      socket,
      event: SERVER_COMPILE_PROGRESS,
      response: {
        role: 'assistant',
        content: `Running Prettier on all files in ${tempDirPath}`,
        variant: 'info',
      },
    })

    execSync('npx prettier --write .', { cwd: './temp' })
  } catch (error) {
    const execError = error as ExecError

    //Todo add emitEvent and/or a Toast for error handling

    if (execError.status !== 0) {
      errors.push({
        type: 'PRETTIER',
        error: (execError.output as Buffer[])[1].toString(),
      })
    }

    console.error(`execSync error: ${error}`)
  }

  emitEvent({
    socket,
    event: SERVER_COMPILE_PROGRESS,
    response: {
      role: 'assistant',
      content: `Compiling TypeScript files in ${tempDirPath}`,
      variant: 'info',
    },
  })

  compile({
    type: 'TYPESCRIPT',
    errors,
    tempDirPath,
  })

  emitEvent({
    socket,
    event: SERVER_COMPILE_PROGRESS,
    response: {
      role: 'assistant',
      content: `Checking for ESLint errors in ${tempDirPath}`,
      variant: 'info',
    },
  })

  compile({
    type: 'ESLINT',
    errors,
    tempDirPath,
  })

  // Clean up the temporary file
  //unlinkSync(tempFilePath)

  console.log(JSON.stringify(errors, null, 2))

  return errors
}
