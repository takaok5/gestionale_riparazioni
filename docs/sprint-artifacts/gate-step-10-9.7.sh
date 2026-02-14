#!/usr/bin/env bash
set -euo pipefail

echo "=== GATE: PRE-MERGE (STEP 10) ==="

BRANCH=$(git branch --show-current)
if [[ ! "$BRANCH" == story/* && "$BRANCH" != "main" ]]; then
  echo "GATE FAIL: Not on story/* or main branch"
  exit 1
fi
echo "OK branch: $BRANCH"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "GATE FAIL: Uncommitted changes detected"
  git status --short
  exit 1
fi
echo "OK working tree clean"

git fetch origin main
BEHIND=$(git rev-list --count HEAD..origin/main)
if [ "$BEHIND" -gt 0 ]; then
  echo "GATE FAIL: Branch is $BEHIND commits behind origin/main"
  exit 1
fi
echo "OK up to date with origin/main"

npm test -- --run >/dev/null

echo "OK tests pass"

if git diff origin/main..HEAD -- . \
  ':(exclude)docs/sprint-artifacts/gate-step-09-9.7.sh' \
  ':(exclude)docs/sprint-artifacts/gate-step-10-9.7.sh' | \
  grep -iE "^(\+|\-).*?(password|secret|api[._]?key|token|credential).*=.*[\"']"; then
  echo "GATE FAIL: Possible secrets in diff"
  exit 1
fi

echo "OK no secrets detected"
echo "GATE PASS: READY TO MERGE"
