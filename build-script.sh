#!/bin/bash
# Custom build script for Vercel deployment

# Build the frontend
echo "Building frontend..."
npm run build

# Build the server components
echo "Building server components..."
npx esbuild server/**/*.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist

# Prepare API serverless functions
echo "Preparing API serverless functions..."
mkdir -p dist/api
cp api/api.js dist/api/
cp api/hello.js dist/api/

# Make sure the API files are executable
chmod +x dist/api/api.js
chmod +x dist/api/hello.js

echo "Build completed successfully"