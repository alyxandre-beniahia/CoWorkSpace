#!/bin/sh
set -e
cd /app
# Synchroniser node_modules du volume avec package.json (ex. après ajout de resend)
npm install
npx prisma generate
# Appliquer les migrations et exécuter le seed (rôles admin/member + admin@test.com)
npx prisma migrate deploy
npx prisma db seed
exec "$@"
