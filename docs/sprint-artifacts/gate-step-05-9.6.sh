#!/usr/bin/env bash
set -e

echo "=== GATE: ATDD RED PHASE (9.6) ==="

TEST_LIST_FILE="docs/sprint-artifacts/atdd-tests-9.6.txt"
if [ ! -f "$TEST_LIST_FILE" ]; then
  echo "GATE FAIL: Missing $TEST_LIST_FILE"
  exit 1
fi

NEW_TESTS=$(tr -d '\r' < "$TEST_LIST_FILE")
if [ -z "$NEW_TESTS" ]; then
  echo "GATE FAIL: No test files listed"
  exit 1
fi

echo "Test files listed: $(echo "$NEW_TESTS" | wc -l)"

EXPECT_COUNT=$(grep -rh "expect(" $NEW_TESTS 2>/dev/null | wc -l)
if [ "$EXPECT_COUNT" -lt 5 ]; then
  echo "GATE FAIL: Only $EXPECT_COUNT expect(), minimum 5"
  exit 1
fi
echo "Assertions: $EXPECT_COUNT"

echo "Running tests (expect RED)..."
npm test -- --run 2>&1 | tee docs/sprint-artifacts/test-output-9.6.txt
TEST_EXIT=${PIPESTATUS[0]}

if [ "$TEST_EXIT" -eq 0 ]; then
  echo "GATE FAIL: Tests PASS but should FAIL (RED phase)"
  exit 1
fi
echo "Tests fail as expected (RED phase verified)"

if grep -rE "(TODO|SKIP|\.skip\()" $NEW_TESTS; then
  echo "GATE FAIL: Tests contain TODO/SKIP"
  exit 1
fi
echo "No TODO/SKIP in tests"

echo "=== GATE PASS: ATDD RED PHASE ==="
cat "$TEST_LIST_FILE"
