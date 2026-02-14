#!/usr/bin/env bash
set -euo pipefail

STORY_ID="9.7"

echo "=== GATE: ATDD RED PHASE ==="

NEW_TESTS=$(git diff --name-only --diff-filter=A | grep -E "\.spec\.ts$" || true)
if [ -z "$NEW_TESTS" ]; then
  echo "GATE FAIL: No test files created"
  exit 1
fi
echo "Test files: $(echo "$NEW_TESTS" | wc -l)"

EXPECT_COUNT=$(grep -rh "expect(" $NEW_TESTS 2>/dev/null | wc -l)
if [ "$EXPECT_COUNT" -lt 5 ]; then
  echo "GATE FAIL: Only $EXPECT_COUNT expect(), minimum 5"
  exit 1
fi
echo "Assertions: $EXPECT_COUNT"

echo "Running tests (RED expected)..."
set +e
npm test -- --run 2>&1 | tee docs/sprint-artifacts/test-output-${STORY_ID}.txt
TEST_EXIT=${PIPESTATUS[0]}
set -e

if [ "$TEST_EXIT" -eq 0 ]; then
  echo "GATE FAIL: Tests PASS but should FAIL (RED phase)"
  exit 1
fi
echo "Tests fail as expected (RED phase verified)"

if grep -rE "(\bTODO\b|\bSKIP\b|\.skip\()" $NEW_TESTS; then
  echo "GATE FAIL: Tests contain TODO/SKIP"
  exit 1
fi
echo "No TODO/SKIP in tests"

echo "=== GATE PASS: ATDD RED PHASE ==="
cat docs/sprint-artifacts/atdd-tests-${STORY_ID}.txt
