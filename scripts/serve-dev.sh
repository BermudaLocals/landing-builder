#!/usr/bin/env bash
# Starts the production server against the Railway DEVELOPMENT database.
#
# Run through railway so the service variables are injected; only the
# private hostname is swapped for the development TCP proxy:
#
#   railway run --service Postgres-4iaU -- bash scripts/serve-dev.sh
#
# Clerk keys and AI provider credentials come from YOUR local environment
# (set them once at the user/machine level) — nothing is printed or stored:
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
#   AI_PROVIDER (e.g. kimi), KIMI_API_KEY / NVIDIA_API_KEY / OPENAI_API_KEY
set -e
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not injected — run via: railway run --service Postgres-4iaU -- bash scripts/serve-dev.sh"
  exit 1
fi
export DATABASE_URL="${DATABASE_URL/postgres-4iau.railway.internal:5432/altaria.proxy.rlwy.net:54579}"
echo "serving with development database (altaria proxy), AI_PROVIDER=${AI_PROVIDER:-mock}"
exec npm start
