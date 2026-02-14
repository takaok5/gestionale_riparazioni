#!/usr/bin/env bash
set -euo pipefail

STORY_FILE=$(ls docs/stories/9.7.*.story.md | head -1)

for ac in $(grep -n '^### AC' "$STORY_FILE" | cut -d: -f1); do
  BLOCK=$(sed -n "${ac},$((ac+30))p" "$STORY_FILE")
  echo "$BLOCK" | grep -q 'Given' || { echo 'AC missing Given'; exit 1; }
  echo "$BLOCK" | grep -q 'When' || { echo 'AC missing When'; exit 1; }
  echo "$BLOCK" | grep -q 'Then' || { echo 'AC missing Then'; exit 1; }
done

grep -qE '\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\bFIXME\b' "$STORY_FILE" && exit 1 || true

echo 'GATE PASS: Story validated'
echo "$STORY_FILE"