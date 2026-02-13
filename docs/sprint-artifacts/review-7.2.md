---
story_id: '7.2'
reviewed_at: '2026-02-13T10:24:40+01:00'
---

# Review 7.2

### Issue 1
- File: packages/backend/src/__tests__/preventivi-notifiche-atdd.spec.ts
- Problem: Test suite used fake timers in eforeEach without restoring real timers, which can leak timer state into subsequent files.
- Fix: Added fterEach(() => vi.useRealTimers()).
- Status: RESOLVED

### Issue 2
- File: packages/backend/src/services/preventivi-service.ts
- Problem: Attachment path string was duplicated in both success/failure notification branches, increasing drift risk.
- Fix: Introduced shared helper createPreventivoAttachmentPath(preventivoId) and reused in both branches.
- Status: RESOLVED

### Issue 3
- File: docs/stories/7.2.invio-email-preventivo.story.md
- Problem: One completed [x] task referenced preventivi-send-atdd.spec.ts, but implemented evidence is in preventivi-notifiche-atdd.spec.ts.
- Fix: Updated task text to point to the actual implemented test file.
- Status: RESOLVED
