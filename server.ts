import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { setupDatabase } from './app/database'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

async function start() {
  await setupDatabase()

  await app.prepare()
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const port = process.env.PORT || 3000
  server.listen(port, (err?: unknown) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
}

start().catch((error) => {
  console.error('Error starting server:', error)
  process.exit(1)
})
