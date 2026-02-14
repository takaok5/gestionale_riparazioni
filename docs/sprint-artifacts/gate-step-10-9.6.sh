#!/usr/bin/env bash
set -euo pipefail

echo "=== GATE: PRE-MERGE READY (9.6) ==="

BRANCH=$(git branch --show-current)
if [[ ! "$BRANCH" == story/* ]]; then
  echo "GATE FAIL: Not on story/* branch"
  exit 1
fi
echo "OK Branch: $BRANCH"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "GATE FAIL: Uncommitted changes detected"
  git status --short
  exit 1
fi
echo "OK Working tree clean"

git fetch origin main >/dev/null 2>&1
BEHIND=$(git rev-list --count HEAD..origin/main)
if [ "$BEHIND" -gt 0 ]; then
  echo "GATE FAIL: branch is $BEHIND commits behind origin/main"
  exit 1
fi
echo "OK Up to date with origin/main"

npm test -- --run >/dev/null
echo "OK Tests pass"

if git diff origin/main..HEAD -- . ':(exclude)docs/sprint-artifacts/gate-step-*' \
  | grep -iE "(password|secret|api[._]?key|token|credential).*=.*['\"]"; then
  echo "GATE FAIL: possible secrets in diff"
  exit 1
fi
echo "OK No secrets detected"

echo "=== GATE PASS: READY TO MERGE (9.6) ==="
