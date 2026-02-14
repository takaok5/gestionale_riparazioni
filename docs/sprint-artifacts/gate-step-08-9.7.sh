#!/usr/bin/env bash
set -euo pipefail

STORY_ID="9.7"
STORY_FILE=$(ls docs/stories/9.7.*.story.md | head -1)
REVIEW_FILE="docs/sprint-artifacts/review-${STORY_ID}.md"

echo "=== GATE: CODE REVIEW ==="

npm test -- --run
npm run lint

if grep -E '^\s*- \[x\].*([Dd]eferred|TODO|SKIP|WIP|N/A)' "$STORY_FILE"; then
  echo "GATE FAIL: false positive task markers"
  exit 1
fi

FALSE_POSITIVES=0
while read -r task; do
  TASK_NUM=$(echo "$task" | grep -oE 'Task [0-9]+\.[0-9]+' || true)
  if [ -n "$TASK_NUM" ]; then
    if ! git log --oneline -20 | grep -qi "$TASK_NUM"; then
      FALSE_POSITIVES=$((FALSE_POSITIVES + 1))
    fi
  fi
done < <(grep -E '^\s*- \[x\]' "$STORY_FILE")
if [ "$FALSE_POSITIVES" -gt 0 ]; then
  echo "GATE FAIL: $FALSE_POSITIVES tasks without commit evidence"
  exit 1
fi

[ -f "$REVIEW_FILE" ] || { echo "GATE FAIL: review file missing"; exit 1; }
ISSUE_COUNT=$(grep -c '^### Issue' "$REVIEW_FILE" || echo 0)
[ "$ISSUE_COUNT" -ge 3 ] || { echo "GATE FAIL: only $ISSUE_COUNT issues"; exit 1; }
OPEN_COUNT=$(grep -c 'Status: OPEN\|Status: PENDING' "$REVIEW_FILE" || true)
[ "$OPEN_COUNT" -eq 0 ] || { echo "GATE FAIL: $OPEN_COUNT open issues"; exit 1; }

echo "=== GATE PASS: CODE REVIEW ==="