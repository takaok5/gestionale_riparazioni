# Review 9.3

### Issue 1 - FAQ not actually expandable in UI
Status: RESOLVED

- Problem: FAQ entries were rendered as static `<article>` blocks, while AC-2 requires expandable answers.
- Fix: Replaced FAQ entries with semantic `<details><summary>` blocks in `packages/frontend/src/App.tsx`.
- Verification: `packages/frontend/src/__tests__/public-contatti-faq-pages.atdd.spec.ts` passes and FAQ question/answer markup is present with expandable structure.

### Issue 2 - No fallback for empty FAQ dataset
Status: RESOLVED

- Problem: If FAQ content becomes empty, the page rendered an empty container with no user feedback.
- Fix: Added explicit fallback message `Nessuna FAQ disponibile` when no FAQ entries exist in `packages/frontend/src/App.tsx`.
- Verification: Rendering path now includes deterministic fallback branch and existing tests still pass.

### Issue 3 - Test seed helper could silently ignore wrong FAQ question keys
Status: RESOLVED

- Problem: `seedPublicPageContentForTests` updated FAQ answers by question text but ignored unknown question names, risking false-positive tests.
- Fix: Added guard that throws `PUBLIC_FAQ_QUESTION_NOT_FOUND` when unknown questions are provided in `packages/backend/src/services/anagrafiche-service.ts`.
- Verification: Backend test suite passes and helper now fails fast for invalid seed inputs.

### Issue 4 - Story task references pointed to wrong ATDD files
Status: RESOLVED

- Problem: Story tasks 6/7 referenced `public-home-vetrina.atdd.spec.ts` and `public-services-api.atdd.spec.ts`, not the actual story 9.3 test files.
- Fix: Corrected task references to `public-contatti-faq-pages.atdd.spec.ts` and `public-contacts-faq-api.atdd.spec.ts` in `docs/stories/9.3.pagine-contatti-e-faq.story.md`.
- Verification: Task-to-code traceability now maps directly to modified spec files.
