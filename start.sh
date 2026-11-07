#!/usr/bin/env sh
set -u
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Noesis needs Node.js 20.19 or newer."
  echo "Why: the 'node' command was not found."
  echo "Fix: install Node.js from https://nodejs.org/ and run ./start.sh again."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "Noesis needs npm, which normally ships with Node.js."
  echo "Fix: reinstall Node.js from https://nodejs.org/."
  exit 1
fi

exec npm start -- "$@"
