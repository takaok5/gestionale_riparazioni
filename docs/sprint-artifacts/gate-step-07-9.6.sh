#!/usr/bin/env bash
set -euo pipefail

echo "=== GATE: GREEN PHASE (9.6) ==="

echo "TypeCheck..."
npm run typecheck
echo "TypeCheck pass"

echo "Lint..."
npm run lint
echo "Lint pass"

echo "Build..."
npm run build
echo "Build pass"

ATDD_TESTS_FILE="docs/sprint-artifacts/atdd-tests-9.6.txt"
if [ ! -f "$ATDD_TESTS_FILE" ]; then
  echo "GATE FAIL: Missing $ATDD_TESTS_FILE"
  exit 1
fi

ATDD_LINES=$(tr -d '\r' < "$ATDD_TESTS_FILE")
FRONTEND_TESTS=$(echo "$ATDD_LINES" | grep '^packages/frontend/' | sed 's#^packages/frontend/##' | tr '\n' ' ')
BACKEND_TESTS=$(echo "$ATDD_LINES" | grep '^packages/backend/' | sed 's#^packages/backend/##' | tr '\n' ' ')

if [ -z "$FRONTEND_TESTS$BACKEND_TESTS" ]; then
  echo "GATE FAIL: No ATDD tests listed"
  exit 1
fi

if [ -n "$BACKEND_TESTS" ]; then
  echo "ATDD backend tests: $BACKEND_TESTS"
  (cd packages/backend && npm run test -- --run $BACKEND_TESTS)
fi

if [ -n "$FRONTEND_TESTS" ]; then
  echo "ATDD frontend tests: $FRONTEND_TESTS"
  (cd packages/frontend && npm run test -- --run $FRONTEND_TESTS)
fi

echo "Running full test suite..."
npm test -- --run

echo "Checking TODO/FIXME + console.log in changed ts/tsx files..."
CHANGED_FILES=$(git status --porcelain | awk '{print $2}' | grep -E '\.(ts|tsx)$' || true)
for f in $CHANGED_FILES; do
  if [ -f "$f" ]; then
    if grep -nE "\bTODO\b|\bFIXME\b|\bXXX\b|\bHACK\b" "$f"; then
      echo "GATE FAIL: $f contains TODO/FIXME"
      exit 1
    fi
    if grep -n "console\.log" "$f" | grep -v "// keep"; then
      echo "GATE FAIL: $f contains console.log"
      exit 1
    fi
  fi
done

echo "=== GATE PASS: GREEN PHASE ==="
