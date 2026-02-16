#!/bin/sh
set -e

CERT_DIR="/app/certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

# Step 1: Generate self-signed SSL certificate if missing
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Generating self-signed SSL certificate..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days 365 -nodes \
    -subj "/CN=localhost" \
    2>/dev/null
  echo "SSL certificate generated."
fi

# Step 2: Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate dev --name init --skip-generate 2>/dev/null || \
npx prisma migrate deploy 2>/dev/null || \
echo "Migration skipped (may already be applied)"

echo "Generating Prisma client..."
npx prisma generate

# Step 3: Start the server with hot reload
echo "Starting backend server..."
exec npx tsx watch src/index.ts
