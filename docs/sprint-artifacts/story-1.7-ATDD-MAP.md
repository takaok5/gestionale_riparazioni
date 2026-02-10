## ATDD Mapping - Story 1.7

### Tests AC-1

- **Given** I am authenticated as `ADMIN` with header `Authorization: Bearer <admin_access_token>` and payload `{ "nome": "Mario", "cognome": "Rossi", "ragione_sociale": "Rossi SRL", "tipologia": "azienda", "indirizzo": "Via Roma 1", "citta": "Milano", "cap": "20100", "provincia": "MI", "codice_cliente": "CL0000001" }`
- **When** I call `POST /api/clienti` with that payload
- **Then** I receive HTTP `201` with `response.body.id=<new_cliente_id>`, and a subsequent `GET /api/audit-log?modelName=Cliente&page=1` returns HTTP `200` with at least one entry containing `userId=<admin_user_id>`, `action="CREATE"`, `modelName="Cliente"`, `objectId="<new_cliente_id>"`, and non-empty `timestamp`
- Test file: `packages/backend/src/__tests__/audit-trail.spec.ts`

### Tests AC-2

- **Given** I am authenticated as `ADMIN`, a `Fornitore` with `id=5` exists with `ragione_sociale="Ricambi Nord"` and `telefono="0211122233"`, and update payload `{ "ragione_sociale": "Ricambi Nord Srl", "telefono": "0299988877" }`
- **When** I call `PUT /api/fornitori/5` with that payload
- **Then** I receive HTTP `200`, and a subsequent `GET /api/audit-log?modelName=Fornitore&page=1` returns HTTP `200` with at least one entry containing `action="UPDATE"`, `objectId="5"`, `dettagli.old.ragione_sociale="Ricambi Nord"`, `dettagli.new.ragione_sociale="Ricambi Nord Srl"`, `dettagli.old.telefono="0211122233"`, and `dettagli.new.telefono="0299988877"`
- Test file: `packages/backend/src/__tests__/audit-trail.spec.ts`

### Tests AC-3

- **Given** I am authenticated as `ADMIN` and audit entries exist for both `modelName="Cliente"` and `modelName="Fornitore"`
- **When** I call `GET /api/audit-log?modelName=Cliente&page=1`
- **Then** I receive HTTP `200` with JSON `{ "results": [...], "pagination": { "page": 1, "pageSize": 10, "total": <n> } }`, every element in `results` has `modelName="Cliente"`, and `results.length` is `<= 10`
- Test file: `packages/backend/src/__tests__/audit-trail.spec.ts`

### Tests AC-4

- **Given** I am authenticated as `TECNICO` with header `Authorization: Bearer <tecnico_access_token>`
- **When** I call `GET /api/audit-log`
- **Then** I receive HTTP `403` with JSON error `{ "code": "FORBIDDEN", "message": "Accesso negato" }` and no audit-log records
- Test file: `packages/backend/src/__tests__/audit-trail.spec.ts`
