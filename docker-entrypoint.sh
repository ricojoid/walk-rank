#!/bin/sh
set -e

echo "=========================================="
echo "🚀 Starting WalkRank Application Container"
echo "=========================================="

# Check if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "📡 Connected to database URL: $(echo "$DATABASE_URL" | sed -e 's/:[^:]*@/@/g')"
fi

echo "⏳ Ensuring target database exists..."
node scripts/init-db.js || echo "⚠️ Database check notice, proceeding to schema sync."

echo "⏳ Syncing database schema with Prisma..."
# Run prisma db push to automatically create all tables in the target database
npx prisma db push --skip-generate || {
  echo "⚠️ First attempt failed, waiting 3 seconds before retry..."
  sleep 3
  npx prisma db push --skip-generate
}

# Seed database if requested or if SEED_DB=true
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding initial demo data (Super Admin, Users, Steps)..."
  npx tsx prisma/seed.ts || echo "⚠️ Seed script finished with notices."
fi

echo "✅ Database synchronization complete."
echo "🚀 Launching Next.js server on 0.0.0.0:${PORT:-3000}..."

exec "$@"
