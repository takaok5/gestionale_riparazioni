#!/usr/bin/env bash
set -euo pipefail

echo "=== GATE: CODE REVIEW (9.6) ==="
STORY_FILE="docs/stories/9.6.seo-metadata-e-sitemap.story.md"
REVIEW_FILE="docs/sprint-artifacts/review-9.6.md"

npm test -- --run
npm run lint

if grep -E '^\s*- \[x\].*(Deferred|deferred|TODO|SKIP|WIP|N/A)' "$STORY_FILE"; then
  echo "GATE FAIL: false positive markers in story tasks"
  exit 1
fi

[ -f "$REVIEW_FILE" ] || { echo "GATE FAIL: review file missing"; exit 1; }
ISSUE_COUNT=$(grep -c '^### Issue' "$REVIEW_FILE" || echo 0)
[ "$ISSUE_COUNT" -ge 3 ] || { echo "GATE FAIL: only $ISSUE_COUNT issues"; exit 1; }
OPEN_COUNT=$(grep -Ec 'Status: OPEN|Status: PENDING' "$REVIEW_FILE" || true)
OPEN_COUNT=${OPEN_COUNT:-0}
[ "$OPEN_COUNT" -eq 0 ] || { echo "GATE FAIL: open issues in review file"; exit 1; }

echo "=== GATE PASS: CODE REVIEW ==="
