#!/bin/bash

set -e

PORT=8080

echo "🚀 Setting up ngrok for ScoreLeague"
echo "Using port: $PORT"

# Find ngrok binary (global or local)
if command -v ngrok >/dev/null 2>&1; then
  NGROK_BIN="$(command -v ngrok)"
elif [[ -x "./ngrok" ]]; then
  NGROK_BIN="./ngrok"
else
  echo "❌ ngrok not found. Install from https://ngrok.com/download or 'brew install ngrok'."
  exit 1
fi

echo ""
echo "If you haven't set your ngrok authtoken yet, enter it now (leave blank to skip)."
echo "Get token: https://dashboard.ngrok.com/get-started/your-authtoken"
read -p "Authtoken (optional): " token

if [[ -n "$token" ]]; then
  # Try v3 command first; if it fails, fall back to v2 syntax
  if "$NGROK_BIN" config add-authtoken "$token" >/dev/null 2>&1; then
    echo "✔️  Authtoken saved (v3 syntax)."
  else
    echo "ℹ️  v3 syntax failed; trying v2 syntax..."
    "$NGROK_BIN" authtoken "$token"
    echo "✔️  Authtoken saved (v2 syntax)."
  fi
fi

echo ""
echo "🌐 Starting public tunnel (ngrok http $PORT)..."
"$NGROK_BIN" http "$PORT"

echo "(The public URL appears above in the ngrok output.)"
