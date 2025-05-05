#!/bin/bash
set -e

# Make script executable
chmod +x build-vercel.sh

# Build the frontend with Vite
echo "Building frontend with Vite..."
npx vite build

# Create server directory for compiled files
mkdir -p dist/server dist/shared

# Copy necessary JS server files (if any)
cp -r server/*.js dist/server/ 2>/dev/null || :

# Compile TypeScript server files with separate server config
echo "Compiling TypeScript server files..."
npx tsc --project tsconfig.server.json

# Copy shared schema files for direct imports
echo "Copying shared schema files..."
cp -r shared/*.ts shared/*.js dist/shared/ 2>/dev/null || :

# Process shared schema files to work in CommonJS environment
for file in dist/shared/*.ts; do
  if [ -f "$file" ]; then
    # Convert imports to require
    sed -i 's/import \(.*\) from "\(.*\)";/const \1 = require("\2");/g' "$file"
    
    # Add module.exports at the end of file if it doesn't exist
    if ! grep -q "module.exports" "$file"; then
      # Extract all TS exports into a comma-separated list
      exports=$(
        grep -o 'export [A-Za-z]* [A-Za-z]*' "$file" \
        | sed 's/export //g' \
        | tr '\n' ',' \
        | sed 's/,$//' \
        | sed 's/,/, /g'
      )
      # Safely echo with single quotes around the message
      echo 'module.exports = { '"$exports"' };' >> "$file"
    fi
    
    # Rename .ts to .js
    mv "$file" "${file%.ts}.js"
  fi
done

# Create simple index.js to help with requiring shared modules
echo "// Shared module exports for CommonJS environment" > dist/shared/index.js
echo "module.exports = {" >> dist/shared/index.js
echo "  schema: require('./schema')" >> dist/shared/index.js
echo "};" >> dist/shared/index.js

# Make a note for debugging
echo "Build directory structure:"
find dist -type f | sort

echo "Build completed successfully!"
