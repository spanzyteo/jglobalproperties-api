#!/bin/sh
set -e

echo "==================================="
echo "Starting application deployment..."
echo "==================================="

# Debug: Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    echo "Available environment variables:"
    env | grep -E '(DATABASE_URL|NODE_ENV|PORT)' || echo "None found"
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo "✓ Running Prisma migrations..."

# Run Prisma migrations
npx prisma migrate deploy

echo "✓ Migrations completed"
echo "✓ Starting NestJS application..."

# Start the application
exec node dist/src/main.js