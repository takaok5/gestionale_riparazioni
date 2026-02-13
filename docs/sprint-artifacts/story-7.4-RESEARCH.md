## Patterns Found

- `packages/backend/src/routes/fatture.ts:326-344` espone un endpoint PDF con `Content-Type: application/pdf` e `Content-Disposition` per filename; la nuova route etichetta deve seguire questo contratto HTTP.
- `packages/backend/src/routes/riparazioni.ts:118-141` mappa il `NOT_FOUND` di service su `RIPARAZIONE_NOT_FOUND` (404 + messaggio `Riparazione non trovata`); il nuovo endpoint etichetta deve riusare lo stesso mapping.
- `packages/backend/src/__tests__/fatture-lista-dettaglio-atdd.spec.ts:292-313` verifica headers PDF e naming file; pattern riusabile per test ATDD etichetta.

## Known Pitfalls

- Nel backend non esiste ancora una dipendenza dedicata per QR/PDF (`packages/backend/package.json`), quindi serve introdurre librerie senza rompere build/test.
- La conversione millimetri -> punti PDF per formato etichetta (`62x100mm`) e' facile da sbagliare; va fissata con valori deterministici nel generatore.
- Il fallback `codiceCliente` richiede dati cliente con campo disponibile; se la select Prisma non lo include, l'etichetta potrebbe risultare incompleta.

## Stack/Libraries to Use

- `pdfkit` per generazione PDF server-side con dimensioni pagina custom.
- `qrcode` per generare il QR da `codiceRiparazione` (buffer o data URL da incorporare nel PDF).
- Pattern di response HTTP e naming file allineato a `packages/backend/src/routes/fatture.ts`.
