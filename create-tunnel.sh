#!/bin/bash

echo "🚀 Creating public tunnel for ScoreLeague..."
echo "📱 Your testers will be able to access from anywhere!"
echo ""

# Try different tunneling services
if command -v ngrok &> /dev/null; then
    echo "Using ngrok..."
    ngrok http 8000
elif command -v cloudflared &> /dev/null; then
    echo "Using cloudflared..."
    cloudflared tunnel --url http://localhost:8000
else
    echo "Installing simple tunnel solution..."
    # Use a simple web-based tunnel
    curl -s https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-darwin-amd64.zip -o ngrok.zip
    unzip -q ngrok.zip
    ./ngrok http 8000
fi
