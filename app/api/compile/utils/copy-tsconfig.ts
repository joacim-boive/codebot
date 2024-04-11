import path from 'path'
import fs from 'fs'

export const copyTsconfig = () => {
  const rootTsConfigPath = path.join(process.cwd(), 'tsconfig.json')
  const tempTsConfigPath = path.join(process.cwd(), 'temp', 'tsconfig.json')
  fs.copyFileSync(rootTsConfigPath, tempTsConfigPath)

  // // Read the copied tsconfig.json file
  const tsConfigContent = fs.readFileSync(tempTsConfigPath, 'utf8')
  const tsConfig = JSON.parse(tsConfigContent)

  // // Modify the include array to include the temp.tsx file
  tsConfig.include = ['*.tsx', '*.ts', '*.js']

  // Convert the configuration object back to a string
  const tsConfigString = JSON.stringify(tsConfig, null, 2)
  // Write the string back to tsconfig.json
  fs.writeFileSync(path.resolve(__dirname, 'tsconfig.json'), tsConfigString)
}
