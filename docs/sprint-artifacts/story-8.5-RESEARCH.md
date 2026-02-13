## Patterns Found

- packages/backend/src/routes/auth.ts:511 usa il pattern route portale con guard Bearer + delega al service + mapper errori centralizzato; stesso schema da riusare per GET /api/portal/riparazioni.
- packages/backend/src/routes/auth.ts:540 e packages/backend/src/routes/auth.ts:262 mostrano il flusso dettaglio con mapping esplicito FORBIDDEN -> 403 (uildErrorResponse("FORBIDDEN", "FORBIDDEN")).
- packages/backend/src/services/auth-service.ts:824 risolve clienteId dal token e delega a listRiparazioni con filtro cliente + paginazione; pattern riusabile per lista riparazioni portale.
- packages/backend/src/services/auth-service.ts:876 valida ownership (dettaglio.cliente.id !== clienteId) e ritorna FORBIDDEN; e' il controllo chiave per AC-4.
- packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts:105 contiene pattern ATDD completo (setup, token portale, assert su lista/dettaglio/forbidden) da clonare per i nuovi endpoint riparazioni.

## Known Pitfalls

- Riusare solo check token senza ownership check sul dettaglio porta data leak cross-customer (violazione AC-4).
- Filtri stato senza assert su dataset non-vuoto possono produrre test vacui (passano anche con lista vuota).
- Mapping errori incoerente tra route e service (es. VALIDATION_ERROR/NOT_FOUND) crea regressioni su codici HTTP attesi dagli ATDD.

## Stack/Libraries to Use

- Express router gia' in uso in packages/backend/src/routes/auth.ts.
- jsonwebtoken e helper token esistenti gia' usati in auth-service per access token portale.
- Vitest + Supertest per ATDD endpoint HTTP, seguendo il pattern esistente nei test portale.