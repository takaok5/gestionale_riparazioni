---
story_id: '3.1'
completed: '2026-02-11T17:42:59.7633267+01:00'
duration: '1h 33m'
---

# Story 3.1 Summary

## Stats

- Files created: 18
- Files modified: 4
- Lines added: 53
- Tests added: 8
- Commits: 1

## Decisions Made

- Implementato endpoint dedicato `POST /api/riparazioni` con service separato (`riparazioni-service`) per isolare la logica della story.
- Generazione codice `RIP-YYYYMMDD-####` implementata sia in test-store sia nel path Prisma transazionale.
- Introdotto controllo temporale deterministico nei test (`vi.setSystemTime`) per rendere stabile AC-2.

## Deviations from Plan

- Nessuna deviazione sostanziale.

## Issues Encountered

- Mismatch path ATDD nel gate workspace root (`packages/backend/...`) risolto con path `src/__tests__/...`.
- Mismatch tipo `priorita` nel ramo DB risolto con normalizzazione esplicita.
- Artefatti escaping markdown in alcuni documenti risolti riscrivendo i file in formato letterale.

## Lessons Learned

- Nella monorepo con `npm --workspaces`, i path test devono essere compatibili con il workspace che esegue Vitest.
- Bloccare il tempo nei test evita regressioni su logiche date-based.
- Conviene validare e correggere subito i documenti pipeline generati via shell per evitare caratteri di escape invisibili.
