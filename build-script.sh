#!/bin/bash
# Custom build script for Vercel deployment

# Build the frontend
echo "Building frontend..."
npm run build

# Build the server components
echo "Building server components..."
npx esbuild server/**/*.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist

# Copy API files directly (no need to bundle)
echo "Copying API files..."
cp -r api dist/

# Make sure the files are executable
chmod +x dist/api/index.js
chmod +x dist/api/server.js