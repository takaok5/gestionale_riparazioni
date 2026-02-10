# Story 1.2 Validation Report

## Issue 1: Given AC-1 non abbastanza specifico sull'origine del refresh token
- Problema: "ho ottenuto il refresh token da Story 1.1" non definiva setup testabile.
- Fix applicato: AC-1 ora specifica il passo concreto `POST /api/auth/login` con `mario.rossi` / `Password1` come origine del token.
- Verifica: setup riproducibile in test API end-to-end.

## Issue 2: AC-3 aggregava piu' scenari in modo ambiguo
- Problema: scenario token non JWT e scenario token scaduto/firma invalida erano sovrapposti e poco isolabili.
- Fix applicato: separazione esplicita in AC-3 (non JWT) e AC-4 (scaduto/firma invalida), mantenendo derivazione da epic-details.
- Verifica: ogni scenario ora mappa a test dedicato con aspettative specifiche.

## Issue 3: Task test troppo accoppiata a `auth-login.spec.ts`
- Problema: aggiungere tutto nello stesso file aumenta accoppiamento e riduce leggibilita' delle failure.
- Fix applicato: task aggiornata verso file dedicato `packages/backend/src/__tests__/auth-refresh.spec.ts`.
- Verifica: copertura per AC refresh isolata, senza impatto diretto sulla suite login.

## Esito

- Issue trovate: 3
- Issue risolte: 3
- Stato quality: pronto per Step 5 (ATDD RED)
