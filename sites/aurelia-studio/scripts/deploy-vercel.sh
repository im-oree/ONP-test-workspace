#!/usr/bin/env bash
# One-command Vercel deploy for Aurelia Studio.
#
# Prereqs (once):
#   npm i -g vercel
#   vercel login
#
# Usage:
#   npm run deploy            # preview deployment
#   npm run deploy -- --prod  # production deployment
#
# This site lives in a subfolder of the repo, so if you import the repo in the
# Vercel dashboard instead of using this script, set:
#   Root Directory   = sites/aurelia-studio
#   Framework Preset = Vite   (Build: `npm run build`, Output: `dist`)
set -e
cd "$(dirname "$0")/.."

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install it with:  npm i -g vercel" >&2
  exit 1
fi

echo "▸ Building…"
npm run build

echo "▸ Deploying with Vercel…"
# --prebuilt would need `vercel build`; we let Vercel build from source using vercel.json.
vercel deploy "$@"
