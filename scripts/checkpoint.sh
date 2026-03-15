#!/usr/bin/env bash
set -e

cd "$(git rev-parse --show-toplevel)"

if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "Nothing to commit."
  exit 0
fi

git add -A

# Build a message from what changed
CHANGED=$(git diff --cached --name-only | head -20 | sed 's/^/  - /' | tr '\n' '\n')
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

git commit -m "checkpoint: $TIMESTAMP

Files:
$CHANGED"

echo "Committed."
