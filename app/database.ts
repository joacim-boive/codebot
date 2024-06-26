import knex from 'knex'

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './conversations.db',
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (
      conn: { run: (arg0: string, arg1: unknown) => void },
      cb: () => void,
    ) => {
      conn.run('PRAGMA foreign_keys = ON', cb)
    },
  },
  migrations: {
    tableName: 'knex_migrations',
  },
})

export async function setupDatabase() {
  if (!(await db.schema.hasTable('conversations'))) {
    await db.schema.createTable('conversations', (table) => {
      table.increments('id').primary()
      table.string('role').notNullable()
      table.text('content').notNullable()
      table.text('extra').nullable() // Need to have an extra column to store additional information - AI only allows role and content in the message
      table.integer('conversationId').notNullable()
      table.timestamp('timestamp').defaultTo(db.fn.now())
      table.index('timestamp') // Create an index on the 'timestamp' column
    })
  }
}

export default db
