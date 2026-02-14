#!/usr/bin/env bash
set -euo pipefail

STORY_ID="9.7"
PLAN_FILE=".claude/plans/story-${STORY_ID}.plan.md"

[ -f "$PLAN_FILE" ] || exit 1
grep -q "## Files to modify" "$PLAN_FILE" || exit 1
grep -q "## Implementation order" "$PLAN_FILE" || exit 1

TASK_COUNT=$(sed -n '/## Implementation order/,/^## /p' "$PLAN_FILE" | grep -cE '^[0-9]+\.' || echo 0)
[ "$TASK_COUNT" -ge 3 ] || exit 1

echo "GATE PASS: Plan approved"
echo "Tasks: $TASK_COUNT"