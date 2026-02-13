---
story_id: '9.1'
completed: '2026-02-13T23:07:19+01:00'
duration: '31m'
---

# Story 9.1 Summary

## Stats

- Files created: 10
- Files modified: 7
- Lines added: 544
- Lines removed: 22
- Tests added: 10
- Commits: 1

## Decisions Made

- Implemented public homepage directly in packages/frontend/src/App.tsx with explicit sections/labels tied to AC assertions.
- Added root script lighthouse:9.1 in package.json to make AC-3 reproducible.
- Kept CTA contracts explicit (/richiedi-preventivo, /portale/login) in both code and tests.

## Deviations from Plan

- Added passWithNoTests: true to packages/backend/vitest.config.ts to make monorepo ATDD filtered execution deterministic.
- Replaced Django template render with inline HttpResponse in home_view because 	emplates/home.html was missing at review time.

## Issues Encountered

- ash -lc via default Windows launcher was unstable; resolved by using Git Bash path for gate commands.
- Root workspace filtered ATDD run initially failed on backend workspace; resolved with vitest config + workspace-relative ATDD file path.
- Story artifact had a typo in validation notes; corrected during review.

## Lessons Learned

- In workspace test pipelines, ATDD file paths should be workspace-relative to avoid false negatives.
- Public route changes in Django must verify template availability immediately to prevent runtime surprises.
- Updating CLAUDE.md alongside new scripts avoids context drift and later review debt.