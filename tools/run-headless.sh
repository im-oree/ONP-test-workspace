#!/usr/bin/env bash
# One-shot headless verification. Everything outside the repo is wiped between
# turns, so we (re)provision playwright-core + @sparticuz/chromium each run.
#
# Usage: bash tools/run-headless.sh [url] [outDir]
set -e
URL="${1:-http://localhost:5173/}"
OUT="${2:-$(cd "$(dirname "$0")/../docs" && pwd)}"
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK=/home/user/hbx

mkdir -p "$WORK" && cd "$WORK"
[ -f package.json ] || npm init -y >/dev/null 2>&1
npm ls playwright-core >/dev/null 2>&1 || npm i --no-audit --no-fund playwright-core @sparticuz/chromium >/dev/null 2>&1

# Extract the AL2023 shared libs (libnss3/libnspr4/…) chromium needs.
node -e "const fs=require('fs'),z=require('zlib');fs.writeFileSync('/tmp/al.tar',z.brotliDecompressSync(fs.readFileSync('node_modules/@sparticuz/chromium/bin/al2023.tar.br')))"
rm -rf "$WORK/libs" && mkdir -p "$WORK/libs" && tar -xf /tmp/al.tar -C "$WORK/libs"

cp "$HERE/headless-check.mjs" "$WORK/headless-check.mjs"
LD_LIBRARY_PATH="$WORK/libs/lib" node "$WORK/headless-check.mjs" "$URL" "$OUT"
