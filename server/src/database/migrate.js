require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

async function migrate() {
    const db = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS });
    await db.connect();
    try {
        await db.query("SELECT pg_advisory_lock(743921)");
        await db.query("CREATE TABLE IF NOT EXISTS schema_migrations (nome TEXT PRIMARY KEY, aplicado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)");
        const directory = path.join(__dirname, "migrations");
        for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".sql")).sort()) {
            if ((await db.query("SELECT 1 FROM schema_migrations WHERE nome = $1", [file])).rowCount) continue;
            await db.query("BEGIN");
            try {
                await db.query(fs.readFileSync(path.join(directory, file), "utf8"));
                await db.query("INSERT INTO schema_migrations (nome) VALUES ($1)", [file]);
                await db.query("COMMIT");
                console.log(`Aplicada: ${file}`);
            } catch (error) {
                await db.query("ROLLBACK");
                throw error;
            }
        }
    } finally {
        await db.query("SELECT pg_advisory_unlock(743921)");
        await db.end();
    }
}
migrate().catch((error) => { console.error(error.message); process.exitCode = 1; });
