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

export async function POST(req: Request, res: NextApiResponseWithSocket) {
  const files = await req.json()

  // Get the path to the temp directory in your project
  const tempDirPath = join(process.cwd(), 'temp')

  // Create the temp directory if it doesn't exist
  if (!existsSync(tempDirPath)) {
    mkdirSync(tempDirPath)
  }

  //This isn't async
  copyTsconfig()

  // Write the code to a temporary file in the temp directory
  for (const file of files) {
    const { filename, code } = file
    const tempFilePath = join(tempDirPath, filename)
    writeFileSync(tempFilePath, code)

    io.emit('message', `writing file: ${filename}`)

    console.log(`Wrote ${filename} to ${tempFilePath}`)
    console.log(`Code: ${code}`)
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
      // Function to filter TS2307 errors
      const filteredErrors = filterErrors(
        (execError.output as Buffer[])[1].toString(),
      )
      errors.push({
        type: 'TYPESCRIPT',
        error: filteredErrors,
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

    const eslintResult = spawnSync('npx', ['eslint', tempDirPath], {
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

  console.log(JSON.stringify(errors), null, 2)

  return NextResponse.json({
    errors,
  })
}
