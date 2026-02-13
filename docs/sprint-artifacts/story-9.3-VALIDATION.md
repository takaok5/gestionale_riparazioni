# Story 9.3 Validation Notes (Step 4)

## Issue 1 - AC-1 Then not specific enough for placeholder assertion
- Problem: AC-1 ended with generic "visible map/embed placeholder block", not directly assertable with an exact text check.
- Fix: Added explicit expected text `Mappa in aggiornamento` and exact opening-hours string in AC-1 Then.
- Verification: AC-1 Then now contains deterministic literal values suitable for `expect(...).toContain(...)`.

## Issue 2 - AC-3 When bundled multiple actions
- Problem: AC-3 When mixed endpoint requests and page reload flow in one compound sentence, making step/action boundaries unclear.
- Fix: Moved updated-endpoint condition into Given and reduced When to one atomic user action: full page reload for `/contatti` and `/faq`.
- Verification: AC-3 now has a clear precondition/action/assertion split.

## Issue 3 - Missing sad-path AC
- Problem: Story had no invalid-input/error-path acceptance criterion.
- Fix: Added AC-5 for unsupported slug on `GET /api/public/pages/:slug` with expected HTTP 404 and `error.code="PAGE_NOT_FOUND"`.
- Verification: Story now includes explicit sad path with testable API contract.
