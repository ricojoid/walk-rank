const { Client } = require("pg");

async function ensureDatabase() {
  const targetDb = process.env.WALKRANK_DB_NAME || "walkrank";
  const rawUrl =
    process.env.DATABASE_URL ||
    "postgresql://admin:admin123@43.157.212.14:5432/walkrank?schema=public&sslmode=disable";

  // Parse connection details
  let host = "43.157.212.14";
  let port = 5432;
  let user = "admin";
  let password = "admin123";

  try {
    const parsed = new URL(rawUrl);
    host = parsed.hostname || host;
    port = Number(parsed.port) || port;
    user = parsed.username ? decodeURIComponent(parsed.username) : user;
    password = parsed.password ? decodeURIComponent(parsed.password) : password;
  } catch {}

  console.log(`🔍 Checking if database "${targetDb}" exists on ${host}:${port}...`);

  // Maintenance database list to try
  const maintenanceDbs = [
    process.env.POSTGRES_DEFAULT_DB,
    "POSTGRES_DB",
    "postgres",
  ].filter(Boolean);

  let connected = false;
  for (const mDb of maintenanceDbs) {
    const client = new Client({
      host,
      port,
      user,
      password,
      database: mDb,
      ssl: false,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      connected = true;
      console.log(`✅ Connected to PostgreSQL maintenance database "${mDb}".`);

      const res = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [targetDb]
      );

      if (res.rowCount === 0) {
        console.log(`📦 Database "${targetDb}" does not exist. Creating it now...`);
        await client.query(`CREATE DATABASE "${targetDb}"`);
        console.log(`✨ Database "${targetDb}" created successfully!`);
      } else {
        console.log(`👍 Database "${targetDb}" already exists.`);
      }

      await client.end();
      break;
    } catch (err) {
      await client.end().catch(() => {});
      console.warn(`Notice with maintenance db "${mDb}": ${err.message}`);
    }
  }

  if (!connected) {
    console.warn("⚠️ Could not connect to maintenance database to create DB automatically. Prisma will attempt direct connection.");
  }
}

if (require.main === module) {
  ensureDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Init DB Error:", err);
      process.exit(0);
    });
}

module.exports = { ensureDatabase };
