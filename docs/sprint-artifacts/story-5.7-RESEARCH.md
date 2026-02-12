## Patterns Found

- `packages/backend/src/routes/ordini.ts:120` usa endpoint autenticato con payload minimale verso service (`UpdateOrdineFornitoreStatoInput`) e mapper errori dedicato.
- `packages/backend/src/services/anagrafiche-service.ts:3361` valida sempre la transizione stato (`validateOrdineTransition`) prima del write su DB.
- `packages/backend/src/services/anagrafiche-service.ts:3542` usa update condizionale atomico su stock con `updateMany` e fallback errore per evitare race su giacenza.
- `packages/backend/src/services/anagrafiche-service.ts:3587` registra audit (`auditLog.create`) nello stesso flusso transazionale del movimento magazzino.
- `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts:60` adotta helper `patchStato(...)` per ATDD su endpoint ordine e assert puntuali su stato/messaggio.

## Known Pitfalls

- Doppio carico su stessa voce se non si traccia quantitativo gia ricevuto per ogni `OrdineFornitoreVoce`.
- Divergenza tra percorso test-store e database in `anagrafiche-service` puo produrre falsi positivi nei test.
- Aggiornamento stato ordine e carico magazzino non atomico puo lasciare sistema incoerente (ordine ricevuto ma stock non aggiornato, o viceversa).

## Stack/Libraries to Use

- Express router + middleware `authenticate` (`packages/backend/src/routes/ordini.ts`).
- Service layer in TypeScript in `anagrafiche-service` con contract `ok/code/message`.
- Prisma transaction (`getPrismaClient().$transaction`) per aggiornamenti consistenti ordine/voci/articoli.
- Vitest + Supertest per ATDD endpoint (`packages/backend/src/__tests__/*`).

## Validation Issues Found And Fixed

1. Issue: AC-2 aveva Given non specifico ("due voci non ancora completamente ricevute"), quindi non riproducibile in test deterministico.
   Fix applied: aggiunti dati concreti di ordine, voci e giacenze iniziali in AC-2.

2. Issue: AC-3 usava campo non definito (`quantitaRicevutaResidua`), non allineato al dominio e potenzialmente inventato.
   Fix applied: sostituito con stato esplicito e testabile delle voci (`articolo 5 ricevuto 10/10`, `articolo 7 da ricevere 0/5`) e outcome numerico su giacenza.

3. Issue: Task breakdown non esplicitava verifica sad-path AC-4 su messaggio errore e invarianza stock.
   Fix applied: aggiunta task `Sad-path ATDD` con assert su messaggio `"Cannot receive order in BOZZA state"` e assenza incrementi giacenza.
