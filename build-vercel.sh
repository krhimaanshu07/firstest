#!/usr/bin/env bash
set -e

# 1. Run Vite build
echo "▶ Running Vite build…"
vite build

# 2. Clean only dist/server & dist/shared (keep dist/public intact)
echo "▶ Cleaning server/shared directories…"
rm -rf dist/server dist/shared
mkdir -p dist/server dist/shared

# 3. Compile server & shared TS
echo "▶ Compiling server TypeScript…"
tsc -p tsconfig.server.json --outDir dist

# 4. Copy any raw JS server files
echo "▶ Copying extra JS server files…"
cp -R server/*.js dist/server/ 2>/dev/null || true

# 5. Update file extensions and path aliases in imports
echo "▶ Updating import paths…"
# First, normalize all imports to use .js extension
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS version
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "\.\([^"]*\)"/from ".\1.js"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "\.\([^"]*\)\.ts"/from ".\1.js"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "@shared\/\([^"]*\)"/from "..\/shared\/\1.js"/g' {} +

  # Fix any double .js.js extensions
  find dist/server -type f -name "*.js" -exec sed -i '' 's/\.js\.js/.js/g' {} +

  # Fix any remaining imports
  echo "▶ Fixing any remaining imports…"
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "express\.js"/from "express"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "dotenv\.js"/from "dotenv"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "mongoose\.js"/from "mongoose"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "passport\.js"/from "passport"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "express-session\.js"/from "express-session"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "mongodb-memory-server\.js"/from "mongodb-memory-server"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "passport-local\.js"/from "passport-local"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "crypto\.js"/from "crypto"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i '' 's/from "util\.js"/from "util"/g' {} +

  # Fix imports in shared modules
  echo "▶ Fixing shared module imports…"
  find dist/shared -type f -name "*.js" -exec sed -i '' 's/from "\.\([^"]*\)"/from ".\1.js"/g' {} +
  find dist/shared -type f -name "*.js" -exec sed -i '' 's/from "\.\([^"]*\)\.ts"/from ".\1.js"/g' {} +
else
  # Linux/other version
  find dist/server -type f -name "*.js" -exec sed -i 's/from "\.\([^"]*\)"/from ".\1.js"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "\.\([^"]*\)\.ts"/from ".\1.js"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "@shared\/\([^"]*\)"/from "..\/shared\/\1.js"/g' {} +

  # Fix any double .js.js extensions
  find dist/server -type f -name "*.js" -exec sed -i 's/\.js\.js/.js/g' {} +

  # Fix any remaining imports
  echo "▶ Fixing any remaining imports…"
  find dist/server -type f -name "*.js" -exec sed -i 's/from "express\.js"/from "express"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "dotenv\.js"/from "dotenv"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "mongoose\.js"/from "mongoose"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "passport\.js"/from "passport"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "express-session\.js"/from "express-session"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "mongodb-memory-server\.js"/from "mongodb-memory-server"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "passport-local\.js"/from "passport-local"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "crypto\.js"/from "crypto"/g' {} +
  find dist/server -type f -name "*.js" -exec sed -i 's/from "util\.js"/from "util"/g' {} +

  # Fix imports in shared modules
  echo "▶ Fixing shared module imports…"
  find dist/shared -type f -name "*.js" -exec sed -i 's/from "\.\([^"]*\)"/from ".\1.js"/g' {} +
  find dist/shared -type f -name "*.js" -exec sed -i 's/from "\.\([^"]*\)\.ts"/from ".\1.js"/g' {} +
fi

echo "✅ build-vercel.sh completed successfully."
