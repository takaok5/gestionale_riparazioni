#!/usr/bin/env bash
set -euo pipefail

echo "=== GATE: PRE-MERGE (9.6) ==="

BRANCH=$(git branch --show-current)
[[ "$BRANCH" == story/* ]] || { echo "GATE FAIL: branch is not story/*"; exit 1; }

git diff --quiet || { echo "GATE FAIL: unstaged changes present"; exit 1; }
git diff --cached --quiet || { echo "GATE FAIL: staged changes present"; exit 1; }

LAST_MSG=$(git log -1 --format=%s)
echo "$LAST_MSG" | grep -qE "^(feat|fix|chore)" || {
  echo "GATE FAIL: invalid commit message"
  exit 1
}

if git diff HEAD~1 | grep -iE "(password|secret|api[._]?key|token|credential).*=.*['\"]"; then
  echo "GATE FAIL: possible secret in last commit"
  exit 1
fi

echo "=== GATE PASS: PRE-MERGE (9.6) ==="
