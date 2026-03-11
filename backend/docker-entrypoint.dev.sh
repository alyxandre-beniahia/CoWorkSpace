#!/bin/sh
set -e
cd /app
npx prisma generate
exec "$@"
