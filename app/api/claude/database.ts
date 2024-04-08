import knex from "knex";

const db = knex({
  client: "sqlite3",
  connection: {
    filename: "./conversations.db",
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (
      conn: { run: (arg0: string, arg1: any) => void },
      cb: Function
    ) => {
      conn.run("PRAGMA foreign_keys = ON", cb);
    },
  },
  migrations: {
    tableName: "knex_migrations",
  },
});

export async function setupDatabase() {
  await db.schema.createTableIfNotExists("conversations", (table) => {
    table.increments("id").primary();
    table.string("role").notNullable();
    table.text("content").notNullable();
    table.integer("conversationId").notNullable();
    table.timestamp("timestamp").defaultTo(db.fn.now());
  });
}

export default db;
