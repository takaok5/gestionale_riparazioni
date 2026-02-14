#!/usr/bin/env bash
set -euo pipefail
STORY_FILE="docs/stories/9.6.seo-metadata-e-sitemap.story.md"

grep -q "^status:" "$STORY_FILE" || exit 1
AC_COUNT=$(grep -c "^### AC" "$STORY_FILE")
[ "$AC_COUNT" -ge 3 ] || exit 1
GWT=$(grep -cE "^\*\*(Given|When|Then)\*\*" "$STORY_FILE")
[ "$GWT" -ge 9 ] || exit 1

grep -qE "TODO|TBD|PLACEHOLDER" "$STORY_FILE" && exit 1

echo "GATE PASS: Story structure OK"
