#!/usr/bin/env bash
set -euo pipefail

STORY_FILE=$(ls docs/stories/9.7.*.story.md | head -1)

# Frontmatter exists
grep -q '^status:' "$STORY_FILE"

# At least 3 ACs
AC_COUNT=$(grep -c '^### AC' "$STORY_FILE")
[ "$AC_COUNT" -ge 3 ]

# Given/When/Then per AC
GWT=$(grep -cE '^\*\*(Given|When|Then)\*\*' "$STORY_FILE")
[ "$GWT" -ge 9 ]

# No TODO/TBD/PLACEHOLDER
grep -qE '\bTODO\b|\bTBD\b|\bPLACEHOLDER\b' "$STORY_FILE" && exit 1 || true

echo "GATE PASS: Story structure OK"
echo "$STORY_FILE"