#!/bin/bash
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
echo "Starting React dev server on http://localhost:3000"
npm run dev

