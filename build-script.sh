#!/bin/bash
# Custom build script for Vercel deployment

# Build the frontend
echo "Building frontend..."
npm run build

# Build the server components
echo "Building server components..."
npx esbuild server/**/*.ts api/**/*.js --platform=node --packages=external --bundle --format=cjs --outdir=dist