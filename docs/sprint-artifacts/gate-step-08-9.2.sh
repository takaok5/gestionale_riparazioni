#!/bin/bash
set -e

STORY_FILE="docs/stories/9.2.catalogo-servizi-pubblico.story.md"
REVIEW_FILE="docs/sprint-artifacts/review-9.2.md"

echo "=== GATE: CODE REVIEW ==="

echo "Running tests..."
npm test -- --run || { echo "GATE FAIL: Tests failing"; exit 1; }
echo "OK Tests pass"

echo "Running lint..."
npm run lint || { echo "GATE FAIL: Lint errors"; exit 1; }
echo "OK Lint pass"

echo "Checking for false positives..."
if grep -E "^\s*- \[x\].*([Dd]eferred|TODO|SKIP|WIP|N/A)" "$STORY_FILE"; then
  echo "GATE FAIL: Task marked [x] but contains Deferred/TODO/SKIP"
  exit 1
fi
echo "OK No false positives in task markers"

echo "Verifying task evidence..."
FALSE_POSITIVES=0
while read -r task; do
  TASK_NUM=$(echo "$task" | grep -oE "Task [0-9]+\.[0-9]+" || echo "")
  if [ -n "$TASK_NUM" ]; then
    if ! git log --oneline -20 | grep -qi "$TASK_NUM"; then
      echo "WARNING: No commit found for: $task"
      FALSE_POSITIVES=$((FALSE_POSITIVES + 1))
    fi
  fi
done < <(grep -E "^\s*- \[x\]" "$STORY_FILE")
if [ "$FALSE_POSITIVES" -gt 0 ]; then
  echo "GATE FAIL: $FALSE_POSITIVES tasks without commit evidence"
  exit 1
fi
echo "OK All tasks have commit evidence"

echo "Checking review issues..."
[ -f "$REVIEW_FILE" ] || { echo "GATE FAIL: Review file missing"; exit 1; }
ISSUE_COUNT=$(grep -c "^### Issue" "$REVIEW_FILE" 2>/dev/null || echo 0)
[ "$ISSUE_COUNT" -ge 3 ] || { echo "GATE FAIL: Found only $ISSUE_COUNT issues, need 3+"; exit 1; }
echo "OK $ISSUE_COUNT issues documented"

OPEN_COUNT=$(grep -c "Status: OPEN\|Status: PENDING" "$REVIEW_FILE" 2>/dev/null || true)
[ "$OPEN_COUNT" -eq 0 ] || { echo "GATE FAIL: $OPEN_COUNT issues still open"; exit 1; }
echo "OK All issues resolved"

echo "=== GATE PASS: CODE REVIEW ==="