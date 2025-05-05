#!/usr/bin/env bash
set -e

# 1. Run your existing build (Vite → dist/public)
echo "▶ Running npm build script…"
npm run build

# 2. Clean only dist/server & dist/shared (keep dist/public intact)
echo "▶ Cleaning server/shared directories…"
rm -rf dist/server dist/shared
mkdir -p dist/server dist/shared

# 3. Compile server & shared TS (override noEmit)
echo "▶ Compiling server TypeScript…"
tsc \
  --project tsconfig.json \
  --rootDir server \
  --outDir dist/server \
  --noEmit false

echo "▶ Compiling shared TypeScript…"
tsc \
  --project tsconfig.json \
  --rootDir shared \
  --outDir dist/shared \
  --noEmit false

# 4. Copy any raw JS server files
echo "▶ Copying extra JS server files…"
cp -R server/*.js dist/server/ 2>/dev/null || true

# 5. Ensure shared modules export correctly for Node
echo "▶ Patching shared modules for CommonJS…"
for file in dist/shared/*.js; do
  if [ -f "$file" ] && ! grep -q "module.exports" "$file"; then
    exports=$(
      grep -o 'export [A-Za-z]* [A-Za-z]*' "$file" \
        | sed 's/export //g' \
        | tr '\n' ',' \
        | sed 's/,$//' \
        | sed 's/,/, /g'
    )
    echo "module.exports = { $exports };" >> "$file"
    echo "  ↳ Added exports: $exports"
  fi
done

echo "✅ build-vercel.sh completed successfully."
