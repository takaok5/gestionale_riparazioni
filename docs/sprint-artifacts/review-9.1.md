# Review Story 9.1

### Issue 1 - Root homepage could fail at runtime (missing template)
Status: RESOLVED

- Problem: home_view rendered home.html, but no 	emplates/home.html existed in the repository, causing a likely TemplateDoesNotExist on /.
- Fix: switched home_view to return an inline HttpResponse with public homepage sections and CTA links.
- Evidence: gestionale_riparazioni/urls.py:3, gestionale_riparazioni/urls.py:6.

### Issue 2 - ATDD filtered gate failed in monorepo workspace execution
Status: RESOLVED

- Problem: running 
pm test -- --run <atdd-file> across workspaces failed when backend received a frontend-only test filter with no matching files.
- Fix: enabled passWithNoTests in backend vitest config and normalized ATDD test list path to workspace-relative src/__tests__/public-home-vetrina.atdd.spec.ts.
- Evidence: packages/backend/vitest.config.ts:8, docs/sprint-artifacts/atdd-tests-9.1.txt.

### Issue 3 - Operational context drift after adding a new command
Status: RESOLVED

- Problem: new root script lighthouse:9.1 was added but CLAUDE.md command catalog was not updated.
- Fix: added the new command to root CLAUDE.md under ## Commands.
- Evidence: package.json:17, CLAUDE.md:24.

### Issue 4 - Story artifact typo reduced traceability
Status: RESOLVED

- Problem: Step 4 Validation Fixes contained typo ust section instead of 	rust section.
- Fix: corrected wording in story file.
- Evidence: docs/stories/9.1.home-pubblica-vetrina.story.md:65.