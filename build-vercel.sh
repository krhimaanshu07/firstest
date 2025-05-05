#!/bin/bash
set -e

# Build the frontend
npm run build

# Copy necessary server files for API functions to work
mkdir -p dist/server
cp -r server/*.ts server/*.js dist/server/

# Compile TypeScript server files
npx tsc -p tsconfig.json --outDir dist/server

# Create a simple index.html for the root path
if [ ! -f dist/index.html ]; then
  echo '<html><head><meta http-equiv="refresh" content="0; url=/"></head></html>' > dist/index.html
fi

echo "Build completed successfully!"