## Patterns Found

- `packages/frontend/src/App.tsx:56` usa `getServiceSlugFromPath` per distinguere route dettaglio (`/servizi/:slug`) dal rendering home: riusare lo stesso approccio per branch espliciti `/faq` e `/contatti` senza rompere il flusso dettaglio.
- `packages/frontend/src/App.tsx:111` imposta `overflow-x-hidden` sulla root della pagina pubblica: mantenere questa utility anche per le nuove view per evitare regressioni mobile.
- `packages/backend/src/routes/public.ts:24` e `packages/backend/src/routes/public.ts:51` incapsulano mapping errori con `buildErrorResponse` e codici HTTP deterministici: seguire lo stesso schema per endpoint FAQ/contatti.
- `packages/backend/src/services/anagrafiche-service.ts:5994` e `packages/backend/src/services/anagrafiche-service.ts:6032` validano input, applicano filtri/sort e restituiscono payload `{ data: ... }`: mantenere shape coerente per nuovi service method pubblici.
- `packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts:22` e `packages/backend/src/__tests__/public-services-api.atdd.spec.ts:6` usano naming test `Tests AC-*` con assert concreti su stringhe/shape payload: estendere questa convenzione per AC 9.3.

## Known Pitfalls

- Se la gestione di `/faq` e `/contatti` intercetta la route prima di `getServiceSlugFromPath`, si rischia regressione su `/servizi/:slug`.
- AC con frasi non atomiche (When con due azioni) generano test fragili e non deterministici.
- Mancanza di sad path su dati configurazione pubblica (es. FAQ vuote o pagina non trovata) lascia senza copertura error-handling pubblico.

## Stack/Libraries to Use

- Frontend: React 18 + render condizionale in `App.tsx` (stesso pattern attuale).
- Backend: Express router `publicRouter` + `buildErrorResponse` per error payload uniforme.
- Test: Vitest/Supertest per endpoint pubblici e render statico React per verifica markup/navigazione.
