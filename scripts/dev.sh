#!/bin/bash

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local from .env.example"
  cp .env.example .env.local
  
  # Check if the file was created successfully
  if [ $? -ne 0 ]; then
    echo "Error: Failed to create .env.local"
    exit 1
  fi
  
  echo "Please edit .env.local and add your Gemini API key"
  echo "Then run this script again"
  exit 0
fi

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set in .env.local"
  echo "Please add your Gemini API key to .env.local"
  exit 1
fi

# Start the development server
echo "Starting development server..."
npm run dev
