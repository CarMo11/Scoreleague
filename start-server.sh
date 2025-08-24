#!/bin/bash

echo "🚀 Starting ScoreLeague Development Server..."
echo "📱 Access on your phone: http://192.168.178.51:8000/index_simple.html"
echo "💻 Access on your computer: http://localhost:8000/index_simple.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================="

python3 -m http.server 8000
