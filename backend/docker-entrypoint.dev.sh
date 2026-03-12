#!/bin/sh
set -e
cd /app
# Synchroniser node_modules du volume avec package.json (ex. après ajout de resend)
npm install
npx prisma generate
exec "$@"
