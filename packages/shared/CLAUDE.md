# packages/shared

## Role
Package condiviso tra frontend e backend. Contiene tipi TypeScript (enums, interfaces) e validatori Zod usati da entrambi i lati.

## Pattern
- **Named exports only** da `src/index.ts` (barrel file)
- **Zod schemas** esportati per ogni entita (usati dal middleware di validazione backend e da React Hook Form frontend)
- **Tipi inferiti da Zod**: `type Xyz = z.infer<typeof xyzSchema>` (single source of truth)
- **Enum come const object** per compatibilita runtime
- **Nessuna dipendenza** da backend o frontend (solo Zod come dependency)

## Key Files
- `src/index.ts` — Barrel export
- `src/types/index.ts` — Tutti i tipi condivisi + enums (Role, StatoRiparazione, Priorita, etc.)
- `src/validators/index.ts` — Zod schemas per tutte le entita

## Anti-Pattern
- NO import da `@gestionale/backend` o `@gestionale/frontend`
- NO dipendenze Node.js-specific (deve funzionare anche in browser)
- NO logica di business (solo tipi e validazione)
- NO `any` (usare `unknown` + type guard)

_See root CLAUDE.md for global rules_
