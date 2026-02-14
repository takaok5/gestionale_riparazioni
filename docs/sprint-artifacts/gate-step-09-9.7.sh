#!/usr/bin/env bash
set -euo pipefail

echo "=== GATE: STEP 9 PRE-MERGE (9.7) ==="

BRANCH=$(git branch --show-current)
if [[ ! "$BRANCH" == story/* ]]; then
  echo "GATE FAIL: Not on story/* branch"
  exit 1
fi
echo "OK branch: $BRANCH"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "GATE FAIL: Working tree is not clean"
  git status --short
  exit 1
fi
echo "OK working tree clean"

LAST_MSG=$(git log -1 --format=%s)
if ! echo "$LAST_MSG" | grep -qE '^(feat|fix|chore)\('; then
  echo "GATE FAIL: Invalid commit message format -> $LAST_MSG"
  exit 1
fi
echo "OK commit message: $LAST_MSG"

if git diff HEAD~1 | grep -iE '(password|secret|api[._]?key|token|credential).*=.*["'"'"']'; then
  echo "GATE FAIL: Potential secrets in diff"
  exit 1
fi
echo "OK no secrets detected"

echo "GATE PASS: Ready for merge"
