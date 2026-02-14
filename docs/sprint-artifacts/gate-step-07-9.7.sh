#!/usr/bin/env bash
set -euo pipefail

STORY_ID="9.7"

echo "=== GATE: GREEN PHASE ==="

echo "TypeCheck..."
npm run typecheck

echo "Lint..."
npm run lint

echo "Build..."
npm run build

ATDD_TESTS_FILE="docs/sprint-artifacts/atdd-tests-${STORY_ID}.txt"
if [ ! -f "$ATDD_TESTS_FILE" ]; then
  echo "GATE FAIL: Missing atdd-tests-${STORY_ID}.txt"
  exit 1
fi
ATDD_TESTS=$(tr '\n' ' ' < "$ATDD_TESTS_FILE")
if [ -z "${ATDD_TESTS// }" ]; then
  echo "GATE FAIL: Empty ATDD test list"
  exit 1
fi

echo "ATDD tests: $ATDD_TESTS"
npm test -- --run $ATDD_TESTS

echo "Running full test suite..."
npm test -- --run

CHANGED_FILES=$(git diff --name-only -- '*.ts' '*.tsx'; git diff --cached --name-only -- '*.ts' '*.tsx')
CHANGED_FILES=$(echo "$CHANGED_FILES" | sort -u)
for f in $CHANGED_FILES; do
  [ -f "$f" ] || continue
  if grep -nE '\bTODO\b|\bFIXME\b|\bXXX\b|\bHACK\b' "$f"; then
    echo "GATE FAIL: $f contains TODO/FIXME"
    exit 1
  fi
  if grep -n 'console\.log' "$f" | grep -v '// keep'; then
    echo "GATE FAIL: $f contains console.log"
    exit 1
  fi
done

npx madge --circular packages/*/src >/dev/null 2>&1 || true

echo "=== GATE PASS: GREEN PHASE ==="