#!/bin/sh
set -e

# Run Prisma migrations
echo "==> Running Prisma migrations..."
if [ -x "node_modules/.bin/prisma" ]; then
  node_modules/.bin/prisma migrate deploy
elif [ -f "node_modules/prisma/build/index.js" ]; then
  node node_modules/prisma/build/index.js migrate deploy
else
  echo "Error: Prisma CLI not found in node_modules" >&2
  exit 1
fi

# Start the application
echo "==> Starting application..."
exec "$@"
