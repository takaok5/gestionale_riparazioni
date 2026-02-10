# Architecture Document: Gestionale Riparazioni

## Tech Stack

### Languages & Runtime
- **Primary Language:** TypeScript ^5.7.0 (strict mode)
- **Runtime:** Node.js (ES2022 target, ESNext modules)

### Framework
- **Backend:** Express ^4.21.0 — maturo, vasto ecosistema middleware (FR-001–FR-014)
- **Frontend:** React ^18.3.0 + Vite ^6.1.0 — performance (NFR-001: FCP <1.5s), component-based SPA

### Database
- **Primary:** PostgreSQL — ACID, scalabile (NFR-006: 100K+ record), JSON support
- **ORM:** Prisma ^6.3.0 — type-safe queries, schema-first, migrations versionabili
- **Migrations:** Prisma Migrate

### Styling
- **CSS Framework:** Tailwind CSS ^3.4.0 — utility-first, responsive (NFR-003)
- **Component Library:** shadcn/ui — accessibile (WCAG AA), personalizzabile

### Auth & Security
- **JWT:** jsonwebtoken ^9.0.2 — access token (15min) + refresh token (7d) (FR-001, NFR-002)
- **Password:** bcryptjs ^2.4.3 — salt rounds 12 (NFR-002)
- **Headers:** Helmet ^8.0.0 — CSP, HSTS, X-Frame-Options
- **CORS:** cors ^2.8.5 — origin limitato a frontend
- **Rate Limiting:** express-rate-limit — protezione brute-force (NFR-002)

### Validation
- **Zod** ^3.24.0 — validazione runtime + type inference, condiviso frontend/backend

### Testing
- **Unit/Integration:** Vitest ^3.0.0 (globals, environment: node, coverage: v8)
- **HTTP Testing:** Supertest ^7.0.0
- **E2E:** Playwright
- **Coverage target:** Backend ≥ 80%, Frontend ≥ 60% (NFR-005)

### Tools & Infrastructure
- **Package Manager:** npm workspaces (monorepo)
- **Bundler:** Vite ^6.1.0
- **Linter:** ESLint + Prettier
- **CI/CD:** GitHub Actions
- **PDF Generation:** Puppeteer (HTML→PDF) o pdfkit (FR-005, FR-006, FR-012)
- **Email:** Nodemailer + SMTP / SendGrid SDK (FR-011)
- **Payments:** Stripe SDK (FR-013)

## Project Structure

```
gestionale_riparazioni/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts                # Entry point Express
│   │   │   ├── app.ts                  # Express app setup
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts             # /api/auth/*
│   │   │   │   ├── users.ts            # /api/users/*
│   │   │   │   ├── clienti.ts          # /api/clienti/*
│   │   │   │   ├── fornitori.ts        # /api/fornitori/*
│   │   │   │   ├── riparazioni.ts      # /api/riparazioni/*
│   │   │   │   ├── preventivi.ts       # /api/preventivi/*
│   │   │   │   ├── fatture.ts          # /api/fatture/*
│   │   │   │   ├── articoli.ts         # /api/articoli/*
│   │   │   │   ├── ordini.ts           # /api/ordini/*
│   │   │   │   ├── dashboard.ts        # /api/dashboard/*
│   │   │   │   ├── report.ts           # /api/report/*
│   │   │   │   ├── audit-log.ts        # /api/audit-log
│   │   │   │   └── health.ts           # /api/health
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts             # authenticate + authorize
│   │   │   │   ├── audit.ts            # audit trail logging
│   │   │   │   ├── rate-limit.ts       # rate limiting
│   │   │   │   ├── validate.ts         # Zod validation middleware
│   │   │   │   └── error-handler.ts    # error handler globale
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts     # business logic auth
│   │   │   │   ├── riparazione.service.ts # workflow + transizioni stato
│   │   │   │   ├── preventivo.service.ts  # calcolo totali, generazione PDF
│   │   │   │   ├── fattura.service.ts     # generazione fattura + PDF
│   │   │   │   ├── magazzino.service.ts   # movimenti, alert giacenza
│   │   │   │   ├── email.service.ts       # invio email
│   │   │   │   ├── pdf.service.ts         # generazione PDF
│   │   │   │   └── stripe.service.ts      # integrazione Stripe
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts           # Prisma client singleton
│   │   │   │   ├── logger.ts           # Structured logger
│   │   │   │   └── config.ts           # Environment config
│   │   │   └── types/
│   │   │       └── express.d.ts        # Express augmentation (req.user)
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # Schema database
│   │   │   ├── migrations/             # Prisma migrations
│   │   │   └── seed.ts                 # Seed data
│   │   ├── templates/
│   │   │   ├── preventivo.html         # Template PDF preventivo
│   │   │   ├── fattura.html            # Template PDF fattura
│   │   │   ├── etichetta.html          # Template etichetta
│   │   │   └── email/                  # Template email
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx                # Entry point React
│   │   │   ├── App.tsx                 # Root component + router
│   │   │   ├── index.css               # Tailwind imports
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Layout.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Header.tsx
│   │   │   │   ├── shared/
│   │   │   │   │   ├── DataTable.tsx
│   │   │   │   │   ├── FormField.tsx
│   │   │   │   │   ├── SearchInput.tsx
│   │   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   └── ui/                 # shadcn/ui components
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── riparazioni/
│   │   │   │   ├── clienti/
│   │   │   │   ├── fornitori/
│   │   │   │   ├── preventivi/
│   │   │   │   ├── fatture/
│   │   │   │   ├── magazzino/
│   │   │   │   ├── ordini/
│   │   │   │   ├── report/
│   │   │   │   ├── utenti/
│   │   │   │   └── audit-log/
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useApi.ts
│   │   │   │   └── usePagination.ts
│   │   │   ├── contexts/
│   │   │   │   └── AuthContext.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api.ts              # API client (fetch wrapper)
│   │   │   │   └── utils.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   └── shared/
│       ├── src/
│       │   ├── index.ts
│       │   ├── types/
│       │   │   └── index.ts            # All shared types + enums
│       │   └── validators/
│       │       └── index.ts            # Zod schemas + validators
│       └── package.json
├── e2e/                                # Playwright E2E tests
├── docs/                               # Project documentation
├── .github/workflows/                  # CI/CD
├── .env.example
├── tsconfig.base.json
├── vitest.config.ts
└── package.json                        # Root workspace
```

## Data Models

### Enum Definitions

```
Role: ADMIN | TECNICO | COMMERCIALE
TipoCliente: PRIVATO | AZIENDA
CategoriaFornitore: RICAMBI | SERVIZI | ALTRO
StatoRiparazione: RICEVUTA | IN_DIAGNOSI | PREVENTIVO_EMESSO | IN_ATTESA_APPROVAZIONE | APPROVATA | IN_ATTESA_RICAMBI | IN_LAVORAZIONE | COMPLETATA | CONSEGNATA | ANNULLATA
Priorita: URGENTE | NORMALE | BASSA
StatoPreventivo: BOZZA | INVIATO | APPROVATO | RIFIUTATO | SCADUTO
TipoVoce: MANODOPERA | RICAMBIO | ALTRO
StatoFattura: EMESSA | PAGATA | IN_RITARDO
MetodoPagamento: CONTANTI | CARTA | BONIFICO | ONLINE
TipoMovimento: CARICO | SCARICO | RESO | RETTIFICA
StatoOrdine: BOZZA | EMESSO | CONFERMATO | SPEDITO | RICEVUTO | ANNULLATO
TipoNotifica: EMAIL | SMS
StatoNotifica: INVIATA | FALLITA
```

### Entity: User (FR-001)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| username | String | unique, not null, max 50 | Username login |
| email | String | unique, not null | Email |
| password | String | not null, min 8 | Hash bcrypt (salt 12) |
| role | Role | not null, default TECNICO | Ruolo RBAC |
| isActive | Boolean | not null, default true | Soft delete flag |
| createdAt | DateTime | auto | Data creazione |
| updatedAt | DateTime | auto | Ultima modifica |

**Relations:** hasMany AuditLog, hasMany Riparazione (tecnicoId), hasMany RiparazioneStato (userId), hasMany MovimentoMagazzino (userId)

### Entity: Cliente (FR-002)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| codiceCliente | String | unique, not null | Formato CLI-NNNNNN |
| tipologia | TipoCliente | not null, default PRIVATO | Privato o Azienda |
| nome | String | not null | Nome (obbligatorio per privato) |
| cognome | String | nullable | Cognome |
| ragioneSociale | String | nullable | Obbligatorio se AZIENDA |
| partitaIva | String | nullable, regex ^[0-9]{11}$ | Partita IVA |
| codiceFiscale | String | nullable, regex ^[A-Z0-9]{16}$ | Codice Fiscale |
| indirizzo | String | nullable | Indirizzo |
| citta | String | nullable | Città |
| cap | String | nullable, regex ^[0-9]{5}$ | CAP |
| provincia | String | nullable, regex ^[A-Z]{2}$ | Sigla provincia |
| telefono | String | nullable | Telefono |
| email | String | nullable | Email |
| note | String | nullable | Note libere |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Relations:** hasMany Riparazione, hasMany Fattura
**Constraints:** onDelete RESTRICT se ha Riparazioni

### Entity: Fornitore (FR-003)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| codiceFornitore | String | unique, not null | Formato FOR-NNNNNN |
| categoria | CategoriaFornitore | not null, default ALTRO | Categorizzazione |
| nome | String | not null | Nome |
| cognome | String | nullable | Cognome |
| ragioneSociale | String | nullable | Ragione sociale |
| partitaIva | String | nullable, regex ^[0-9]{11}$ | Partita IVA |
| codiceFiscale | String | nullable, regex ^[A-Z0-9]{16}$ | Codice Fiscale |
| indirizzo | String | nullable | |
| citta | String | nullable | |
| cap | String | nullable, regex ^[0-9]{5}$ | |
| provincia | String | nullable, regex ^[A-Z]{2}$ | |
| telefono | String | nullable | |
| email | String | nullable | |
| note | String | nullable | |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Relations:** hasMany Articolo, hasMany OrdineFornitore
**Constraints:** onDelete RESTRICT se ha OrdiniFornitore attivi

### Entity: Riparazione (FR-004)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| codiceRiparazione | String | unique, not null | Formato RIP-YYYYMMDD-NNNN |
| clienteId | Int | FK → Cliente, not null | Cliente proprietario |
| tecnicoId | Int | FK → User, nullable | Tecnico assegnato |
| tipoDispositivo | String | not null | Tipo (smartphone, PC, ecc.) |
| marcaDispositivo | String | not null | Marca |
| modelloDispositivo | String | not null | Modello |
| serialeDispositivo | String | nullable | Seriale / IMEI |
| descrizioneProblema | String | not null | Problema riportato dal cliente |
| diagnosi | String | nullable | Diagnosi del tecnico |
| noteIntervento | String | nullable | Note sull'intervento eseguito |
| accessoriConsegnati | String | nullable | Accessori lasciati dal cliente |
| stato | StatoRiparazione | not null, default RICEVUTA | Stato corrente workflow |
| priorita | Priorita | not null, default NORMALE | Livello priorità |
| dataRicezione | DateTime | not null, auto | Data ricezione dispositivo |
| dataCompletamento | DateTime | nullable | Auto-set su COMPLETATA |
| dataConsegna | DateTime | nullable | Auto-set su CONSEGNATA |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Relations:** belongsTo Cliente, belongsTo User (tecnico), hasMany RiparazioneStato, hasMany Preventivo, hasMany RicambioUtilizzato, hasMany Fattura
**State Transitions:**
- RICEVUTA → IN_DIAGNOSI
- IN_DIAGNOSI → PREVENTIVO_EMESSO | IN_LAVORAZIONE
- PREVENTIVO_EMESSO → IN_ATTESA_APPROVAZIONE
- IN_ATTESA_APPROVAZIONE → APPROVATA | ANNULLATA
- APPROVATA → IN_ATTESA_RICAMBI | IN_LAVORAZIONE
- IN_ATTESA_RICAMBI → IN_LAVORAZIONE
- IN_LAVORAZIONE → COMPLETATA
- COMPLETATA → CONSEGNATA
- Any → ANNULLATA (Admin only)

**Indexes:** stato, clienteId, tecnicoId, dataRicezione, codiceRiparazione (unique)

### Entity: RiparazioneStato (FR-004)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| riparazioneId | Int | FK → Riparazione, not null | Riparazione |
| statoPrecedente | StatoRiparazione | nullable | Stato prima |
| statoNuovo | StatoRiparazione | not null | Stato dopo |
| userId | Int | FK → User, not null | Chi ha cambiato |
| note | String | nullable | Note sul cambio |
| timestamp | DateTime | not null, auto | Quando |

**Constraints:** Append-only (no UPDATE/DELETE). onDelete CASCADE da Riparazione.

### Entity: Preventivo (FR-005)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| codicePreventivo | String | unique, not null | Codice univoco |
| riparazioneId | Int | FK → Riparazione, not null | Riparazione associata |
| subtotale | Decimal(10,2) | not null | Totale senza IVA |
| aliquotaIva | Decimal(5,2) | not null, default 22.00 | Aliquota IVA % |
| importoIva | Decimal(10,2) | not null | Importo IVA calcolato |
| totale | Decimal(10,2) | not null | Totale con IVA |
| stato | StatoPreventivo | not null, default BOZZA | Stato corrente |
| dataInvio | DateTime | nullable | Data invio al cliente |
| dataRisposta | DateTime | nullable | Data risposta |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Relations:** belongsTo Riparazione, hasMany VocePreventivo
**Constraints:** Immutabile dopo stato INVIATO (solo stato/dataRisposta modificabili)

### Entity: VocePreventivo (FR-005)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| preventivoId | Int | FK → Preventivo, not null, CASCADE | Preventivo |
| tipo | TipoVoce | not null | Manodopera/Ricambio/Altro |
| descrizione | String | not null | Descrizione voce |
| articoloId | Int | FK → Articolo, nullable | Se tipo=RICAMBIO |
| quantita | Decimal(10,2) | not null, min 0.01 | Quantità |
| prezzoUnitario | Decimal(10,2) | not null, min 0 | Prezzo unitario |
| totaleVoce | Decimal(10,2) | not null | quantita × prezzoUnitario |

### Entity: Fattura (FR-006)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| numeroFattura | String | unique, not null | Formato YYYY/NNNN |
| riparazioneId | Int | FK → Riparazione, not null | Riparazione |
| clienteId | Int | FK → Cliente, not null | Cliente |
| subtotale | Decimal(10,2) | not null | Senza IVA |
| aliquotaIva | Decimal(5,2) | not null | Aliquota IVA % |
| importoIva | Decimal(10,2) | not null | Importo IVA |
| totale | Decimal(10,2) | not null | Con IVA |
| stato | StatoFattura | not null, default EMESSA | Stato |
| dataEmissione | DateTime | not null, auto | Data emissione |
| dataScadenza | DateTime | nullable | Scadenza pagamento |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Relations:** belongsTo Riparazione, belongsTo Cliente, hasMany Pagamento
**Constraints:** Immutabile dopo emissione. onDelete RESTRICT.
**Indexes:** numeroFattura (unique), (clienteId, stato) composite

### Entity: Pagamento (FR-006, FR-013)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| fatturaId | Int | FK → Fattura, not null | Fattura |
| importo | Decimal(10,2) | not null, min 0.01 | Importo pagato |
| metodo | MetodoPagamento | not null | Metodo pagamento |
| dataPagamento | DateTime | not null | Data pagamento |
| riferimentoEsterno | String | nullable | ID Stripe / ref. bonifico |
| note | String | nullable | Note |
| createdAt | DateTime | auto | |

**Constraints:** Somma pagamenti ≤ totale fattura. Se somma = totale → fattura.stato = PAGATA.

### Entity: Articolo (FR-007)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| codiceArticolo | String | unique, not null | Codice univoco |
| nome | String | not null | Nome articolo |
| descrizione | String | nullable | Descrizione |
| categoria | String | nullable | Categoria ricambio |
| fornitoreId | Int | FK → Fornitore, nullable, SET NULL | Fornitore preferito |
| prezzoAcquisto | Decimal(10,2) | not null, min 0 | Prezzo acquisto |
| prezzoVendita | Decimal(10,2) | not null, min 0 | Prezzo vendita |
| giacenza | Int | not null, default 0, min 0 | Quantità disponibile |
| sogliaMinima | Int | not null, default 0 | Alert sotto questa soglia |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Relations:** belongsTo Fornitore, hasMany MovimentoMagazzino, hasMany RicambioUtilizzato, hasMany VoceOrdine
**Constraints:** giacenza aggiornata solo tramite MovimentoMagazzino.
**Indexes:** codiceArticolo (unique), giacenza (per alert)

### Entity: MovimentoMagazzino (FR-007)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| articoloId | Int | FK → Articolo, not null | Articolo |
| tipo | TipoMovimento | not null | Carico/Scarico/Reso/Rettifica |
| quantita | Int | not null | Quantità (positiva) |
| riferimentoTipo | String | nullable | "ordine" / "riparazione" / "rettifica" |
| riferimentoId | Int | nullable | ID entità correlata |
| userId | Int | FK → User, not null | Chi ha eseguito |
| note | String | nullable | Note |
| timestamp | DateTime | not null, auto | Quando |

**Constraints:** Append-only. SCARICO solo se giacenza >= quantità.
**Indexes:** (articoloId, timestamp) composite

### Entity: OrdineFornitore (FR-008)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| codiceOrdine | String | unique, not null | Codice univoco |
| fornitoreId | Int | FK → Fornitore, not null | Fornitore |
| stato | StatoOrdine | not null, default BOZZA | Stato ordine |
| dataEmissione | DateTime | nullable | Data emissione |
| dataRicezione | DateTime | nullable | Data ricezione |
| totale | Decimal(10,2) | nullable | Totale ordine |
| note | String | nullable | Note |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Relations:** belongsTo Fornitore, hasMany VoceOrdine
**Constraints:** Non annullabile dopo CONFERMATO (solo Admin).

### Entity: VoceOrdine (FR-008)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| ordineId | Int | FK → OrdineFornitore, not null, CASCADE | Ordine |
| articoloId | Int | FK → Articolo, not null | Articolo |
| quantitaOrdinata | Int | not null, min 1 | Quantità ordinata |
| quantitaRicevuta | Int | not null, default 0 | Quantità ricevuta |
| prezzoUnitario | Decimal(10,2) | not null | Prezzo unitario |

### Entity: RicambioUtilizzato (FR-004, FR-007)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| riparazioneId | Int | FK → Riparazione, not null | Riparazione |
| articoloId | Int | FK → Articolo, not null | Articolo utilizzato |
| quantita | Int | not null, min 1 | Quantità |
| prezzoUnitario | Decimal(10,2) | not null | Prezzo al momento dell'utilizzo |

### Entity: Notifica (FR-011)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| tipo | TipoNotifica | not null | EMAIL / SMS |
| destinatario | String | not null | Email o telefono |
| oggetto | String | nullable | Oggetto email |
| contenuto | String | not null | Corpo messaggio |
| stato | StatoNotifica | not null | INVIATA / FALLITA |
| riferimentoTipo | String | nullable | "riparazione" / "preventivo" / "fattura" |
| riferimentoId | Int | nullable | ID entità correlata |
| timestamp | DateTime | not null, auto | Quando |

**Constraints:** Append-only (log immutabile). No FK dirette (riferimenti polimorfici).

### Entity: AuditLog (FR-014)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, autoincrement | Identificativo |
| userId | Int | FK → User, nullable, SET NULL | Chi ha eseguito |
| action | String | not null | CREATE / UPDATE / DELETE |
| modelName | String | not null | Nome modello |
| objectId | String | not null | ID oggetto |
| dettagli | String | nullable | JSON { old, new } |
| timestamp | DateTime | not null, auto | Quando |

**Constraints:** Append-only. Retention 2 anni.
**Indexes:** (modelName, objectId) composite, timestamp

## API Specification

### Auth (FR-001)

#### `POST /api/auth/login`
- **Description:** Autenticazione utente
- **Auth:** Public
- **Request Body:** `{ "username": "string", "password": "string" }`
- **Response 200:** `{ "data": { "accessToken": "string", "refreshToken": "string", "user": { "id", "username", "email", "role" } } }`
- **Error Codes:** 401 Invalid credentials, 429 Too many attempts
- **FR Reference:** FR-001

#### `POST /api/auth/refresh`
- **Description:** Rinnova access token
- **Auth:** Public
- **Request Body:** `{ "refreshToken": "string" }`
- **Response 200:** `{ "data": { "accessToken": "string", "refreshToken": "string" } }`
- **Error Codes:** 401 Invalid/expired refresh token
- **FR Reference:** FR-001

#### `POST /api/auth/logout`
- **Description:** Invalida refresh token
- **Auth:** Bearer
- **Request Body:** `{ "refreshToken": "string" }`
- **Response 200:** `{ "data": { "message": "Logged out" } }`
- **FR Reference:** FR-001

### Users (FR-001)

#### `GET /api/users`
- **Auth:** Bearer(ADMIN)
- **Query:** `?page=1&limit=50&search=&role=`
- **Response 200:** `{ "data": [...users], "meta": { "page", "limit", "total" } }`
- **FR Reference:** FR-001

#### `POST /api/users`
- **Auth:** Bearer(ADMIN)
- **Request Body:** `{ "username", "email", "password", "role" }`
- **Response 201:** `{ "data": { ...user } }`
- **Error Codes:** 400 Validation, 409 Username/email exists
- **FR Reference:** FR-001

#### `GET /api/users/:id` | `PUT /api/users/:id` | `PATCH /api/users/:id/deactivate`
- **Auth:** Bearer(ADMIN)
- **FR Reference:** FR-001

#### `PUT /api/users/me/password`
- **Auth:** Bearer
- **Request Body:** `{ "currentPassword", "newPassword" }`
- **FR Reference:** FR-001

### Clienti (FR-002)

#### `GET /api/clienti`
- **Auth:** Bearer
- **Query:** `?page=1&limit=50&search=&tipologia=&orderBy=nome&order=asc`
- **Response 200:** `{ "data": [...clienti], "meta": { "page", "limit", "total" } }`
- **FR Reference:** FR-002

#### `POST /api/clienti`
- **Auth:** Bearer
- **Request Body:** `{ "tipologia", "nome", "cognome", "ragioneSociale", "partitaIva", "codiceFiscale", "indirizzo", "citta", "cap", "provincia", "telefono", "email", "note" }`
- **Response 201:** `{ "data": { ...cliente, "codiceCliente": "CLI-000001" } }`
- **Error Codes:** 400 Validation (P.IVA, CF, CAP), 409 Duplicate
- **FR Reference:** FR-002

#### `GET /api/clienti/:id` | `PUT /api/clienti/:id` | `DELETE /api/clienti/:id`
- **FR Reference:** FR-002

#### `GET /api/clienti/:id/riparazioni`
- **Auth:** Bearer
- **Response 200:** `{ "data": [...riparazioni], "meta": {...} }`
- **FR Reference:** FR-002

### Fornitori (FR-003)

#### `GET /api/fornitori` | `POST /api/fornitori` | `GET /api/fornitori/:id` | `PUT /api/fornitori/:id` | `DELETE /api/fornitori/:id`
- **Auth:** Bearer (DELETE: ADMIN)
- **Same pattern as Clienti with categoria field**
- **FR Reference:** FR-003

### Riparazioni (FR-004)

#### `GET /api/riparazioni`
- **Auth:** Bearer
- **Query:** `?page=1&limit=50&stato=&tecnicoId=&clienteId=&priorita=&dataFrom=&dataTo=&search=`
- **FR Reference:** FR-004

#### `POST /api/riparazioni`
- **Auth:** Bearer
- **Request Body:** `{ "clienteId", "tipoDispositivo", "marcaDispositivo", "modelloDispositivo", "serialeDispositivo", "descrizioneProblema", "accessoriConsegnati", "priorita" }`
- **Response 201:** `{ "data": { ...riparazione, "codiceRiparazione": "RIP-20260209-0001" } }`
- **FR Reference:** FR-004

#### `GET /api/riparazioni/:id`
- **Response 200:** `{ "data": { ...riparazione, "cliente": {...}, "tecnico": {...}, "stati": [...], "preventivi": [...], "ricambi": [...] } }`
- **FR Reference:** FR-004

#### `PATCH /api/riparazioni/:id/stato`
- **Auth:** Bearer (tecnico assegnato o ADMIN)
- **Request Body:** `{ "nuovoStato", "note" }`
- **Error Codes:** 400 Invalid transition, 403 Not assigned technician
- **FR Reference:** FR-004

#### `PATCH /api/riparazioni/:id/assegna`
- **Auth:** Bearer(ADMIN, TECNICO)
- **Request Body:** `{ "tecnicoId" }`
- **FR Reference:** FR-004

#### `GET /api/riparazioni/:id/stati` | `GET /api/riparazioni/:id/ricambi` | `POST /api/riparazioni/:id/ricambi`
- **FR Reference:** FR-004

### Preventivi (FR-005)

#### `GET /api/preventivi` | `POST /api/preventivi` | `GET /api/preventivi/:id` | `PUT /api/preventivi/:id`
- **FR Reference:** FR-005

#### `POST /api/preventivi/:id/invia`
- **Description:** Genera PDF + invia email al cliente
- **Response 200:** `{ "data": { ...preventivo, "stato": "INVIATO" } }`
- **FR Reference:** FR-005

#### `PATCH /api/preventivi/:id/risposta`
- **Request Body:** `{ "approvato": true|false }`
- **FR Reference:** FR-005

#### `GET /api/preventivi/:id/pdf`
- **Response:** application/pdf
- **FR Reference:** FR-005, FR-012

### Fatture (FR-006)

#### `GET /api/fatture` | `POST /api/fatture` | `GET /api/fatture/:id` | `GET /api/fatture/:id/pdf`
- **FR Reference:** FR-006

#### `POST /api/fatture/:id/pagamenti` | `GET /api/fatture/:id/pagamenti`
- **FR Reference:** FR-006

### Magazzino (FR-007)

#### `GET /api/articoli` | `POST /api/articoli` | `GET /api/articoli/:id` | `PUT /api/articoli/:id`
- **FR Reference:** FR-007

#### `GET /api/articoli/:id/movimenti` | `POST /api/articoli/:id/movimenti`
- **FR Reference:** FR-007

#### `GET /api/articoli/alert`
- **Description:** Articoli con giacenza ≤ sogliaMinima
- **FR Reference:** FR-007

### Ordini Fornitori (FR-008)

#### `GET /api/ordini` | `POST /api/ordini` | `GET /api/ordini/:id` | `PUT /api/ordini/:id`
- **FR Reference:** FR-008

#### `PATCH /api/ordini/:id/stato` | `POST /api/ordini/:id/ricevi`
- **FR Reference:** FR-008

### Dashboard (FR-009)

#### `GET /api/dashboard`
- **Auth:** Bearer
- **Response 200:** `{ "data": { "riparazioniPerStato": {...}, "caricoTecnici": [...], "alertMagazzino": [...], "ultimiPagamenti": [...] } }`
- **FR Reference:** FR-009

#### `GET /api/dashboard/riparazioni-per-stato` | `GET /api/dashboard/carico-tecnici`
- **FR Reference:** FR-009

### Report (FR-010)

#### `GET /api/report/riparazioni` | `GET /api/report/finanziari` | `GET /api/report/magazzino`
- **Auth:** Bearer(ADMIN)
- **Query:** `?dataFrom=&dataTo=&tecnicoId=`
- **FR Reference:** FR-010

#### `GET /api/report/export/:tipo`
- **Auth:** Bearer(ADMIN)
- **Response:** application/csv or application/vnd.openxmlformats
- **FR Reference:** FR-010

### Notifiche (FR-011)

#### `GET /api/notifiche`
- **Auth:** Bearer(ADMIN)
- **FR Reference:** FR-011

#### `POST /api/notifiche/test`
- **Auth:** Bearer(ADMIN)
- **FR Reference:** FR-011

### Stampa (FR-012)

#### `GET /api/riparazioni/:id/etichetta` | `GET /api/riparazioni/:id/ricevuta`
- **Auth:** Bearer
- **Response:** application/pdf
- **FR Reference:** FR-012

### Pagamenti Online (FR-013)

#### `POST /api/pagamenti/crea-link/:fatturaId`
- **Auth:** Bearer
- **Response 200:** `{ "data": { "paymentUrl": "https://checkout.stripe.com/..." } }`
- **FR Reference:** FR-013

#### `POST /api/webhooks/stripe`
- **Auth:** Stripe signature verification
- **FR Reference:** FR-013

### Audit Log (FR-014)

#### `GET /api/audit-log`
- **Auth:** Bearer(ADMIN)
- **Query:** `?page=1&limit=50&userId=&modelName=&action=&dataFrom=&dataTo=`
- **FR Reference:** FR-014

### Health

#### `GET /api/health`
- **Auth:** Public
- **Response 200:** `{ "status": "ok", "timestamp": "..." }`

### Standard Response Format (NFR-004)

**Success:**
```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 50, "total": 123 }
}
```

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

## Component Architecture

```
App
├── AuthProvider (Context: JWT tokens + user info)
├── Layout
│   ├── Sidebar (navigazione per ruolo)
│   ├── Header (utente, notifiche, logout)
│   └── MainContent
├── Pages (lazy loaded per route)
│   ├── Login
│   ├── Dashboard
│   │   ├── StatoRiparazioniCard
│   │   ├── CaricoTecniciCard
│   │   ├── AlertMagazzinoCard
│   │   └── UltimiPagamentiCard
│   ├── Riparazioni
│   │   ├── RiparazioniList (DataTable + filtri)
│   │   ├── RiparazioneDetail (timeline + tab)
│   │   ├── RiparazioneForm (crea/modifica)
│   │   └── CambioStatoDialog
│   ├── Clienti
│   │   ├── ClientiList / ClienteDetail / ClienteForm
│   ├── Fornitori
│   │   ├── FornitoriList / FornitoreDetail / FornitoreForm
│   ├── Preventivi
│   │   ├── PreventiviList / PreventivoDetail / PreventivoForm
│   ├── Fatture
│   │   ├── FattureList / FatturaDetail / PagamentoForm
│   ├── Magazzino
│   │   ├── ArticoliList / ArticoloDetail / ArticoloForm / MovimentoForm
│   ├── Ordini
│   │   ├── OrdiniList / OrdineDetail / OrdineForm / RicezioneForm
│   ├── Report
│   │   ├── ReportRiparazioni / ReportFinanziari / ReportMagazzino
│   ├── Utenti (Admin)
│   │   ├── UtentiList / UtenteForm
│   └── AuditLog (Admin)
│       └── AuditLogList
└── Shared
    ├── DataTable (generica: paginazione, ordinamento, filtri)
    ├── FormField (label + input + errore)
    ├── SearchInput (debounce)
    ├── ConfirmDialog
    ├── Toast
    ├── Badge (stato colorato)
    ├── Spinner / Skeleton
    ├── PDFViewer
    └── ProtectedRoute (guard ruolo)
```

### State Management
- **Auth state:** React Context (AuthProvider) — JWT tokens + user info
- **Server state:** Custom hooks (useApi) con fetch wrapper — loading/error/data
- **UI state:** useState locale per form, dialog, filtri
- **Pattern:** No Redux (overkill). Context per auth, hooks per API.

## Testing Strategy

### Test Levels

| Level | Framework | What it tests | Coverage target |
|-------|-----------|---------------|-----------------|
| Unit (backend) | Vitest | Validators, services, utils | ≥ 80% |
| Integration (backend) | Vitest + Supertest | API endpoints, middleware, DB | ≥ 80% |
| Unit (frontend) | Vitest | Hooks, utils, pure components | ≥ 60% |
| Integration (frontend) | Vitest + Testing Library | Pages, forms, interactions | ≥ 60% |
| E2E | Playwright | Login, crea riparazione, preventivo, fattura | Critical paths |

### Naming Convention
- Test files: `{name}.test.ts` co-located with tested file
- Describe: module/component name
- It: expected behavior in natural language

### Patterns
- **Arrange-Act-Assert** for unit tests
- **Given-When-Then** for integration/E2E (aligned with story AC)
- **Test database** separate from dev (Prisma with test connection string)
- **Factory functions** for test data creation

## Coding Standards

### Naming
- **Files (backend):** `kebab-case.ts`
- **Files (frontend components):** `PascalCase.tsx`
- **Files (frontend hooks/utils):** `camelCase.ts`
- **Variables/Functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Types/Interfaces:** `PascalCase` (no I prefix)
- **Enums:** `PascalCase` with `UPPER_SNAKE_CASE` values
- **React Components:** `PascalCase`
- **Express Routes:** `kebab-case` (e.g., `/api/audit-log`)

### Mandatory Patterns
- Named exports only (no default export)
- Zod schema validation on every API endpoint
- Standard error format: `{ error: { code, message, details } }`
- Prisma explicit select (no SELECT *)
- Server-side pagination on all list endpoints (default 50, max 100)
- Prisma transactions for multi-step operations
- Business logic in services layer (not in route handlers)

### Forbidden Anti-Patterns
- `any` without justifying comment
- `console.log` in production (use structured logger)
- Inline styles in React (use Tailwind)
- Inline objects/functions in JSX props
- useEffect without explicit deps array
- N+1 queries (use Prisma include/select)
- Direct mutation of `giacenza` (only via MovimentoMagazzino)
- SELECT * in Prisma queries

## FR Coverage Map

| FR | Backend Module | Frontend Module | Notes |
|----|---------------|-----------------|-------|
| FR-001 | routes/auth.ts, routes/users.ts, middleware/auth.ts, services/auth.service.ts | pages/Login.tsx, pages/utenti/, contexts/AuthContext.tsx, hooks/useAuth.ts | Middleware JWT già definito |
| FR-002 | routes/clienti.ts, validators (shared) | pages/clienti/ | Schema Prisma + validatori esistenti |
| FR-003 | routes/fornitori.ts, validators (shared) | pages/fornitori/ | Schema Prisma + validatori esistenti |
| FR-004 | routes/riparazioni.ts, services/riparazione.service.ts | pages/riparazioni/ | Modello + enum da creare |
| FR-005 | routes/preventivi.ts, services/preventivo.service.ts, services/pdf.service.ts, services/email.service.ts | pages/preventivi/ | PDF generation + email |
| FR-006 | routes/fatture.ts, services/fattura.service.ts, services/pdf.service.ts | pages/fatture/ | Numerazione progressiva |
| FR-007 | routes/articoli.ts, services/magazzino.service.ts | pages/magazzino/ | Alert soglie minime |
| FR-008 | routes/ordini.ts, services/magazzino.service.ts | pages/ordini/ | Carico automatico |
| FR-009 | routes/dashboard.ts | pages/Dashboard.tsx | Query aggregate per ruolo |
| FR-010 | routes/report.ts | pages/report/ | Export CSV/Excel |
| FR-011 | services/email.service.ts, routes/notifiche.ts | pages (integrato in riparazioni) | SMTP / SendGrid |
| FR-012 | services/pdf.service.ts, routes/riparazioni.ts (etichetta, ricevuta) | Trigger da UI riparazioni | Puppeteer / pdfkit |
| FR-013 | services/stripe.service.ts, routes/pagamenti.ts, webhooks/stripe | Trigger da UI fatture | Stripe Checkout |
| FR-014 | middleware/audit.ts, routes/audit-log.ts | pages/audit-log/ | Schema AuditLog esistente |

---

_Generated by project-startup pipeline - Step 3: Architecture_
