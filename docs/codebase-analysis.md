# Codebase Analysis - Gestionale Riparazioni

## Tech Stack

### Runtime & Linguaggi
- **Node.js** runtime
- **TypeScript** `^5.7.0` (strict mode, target ES2022, module ESNext)
- **Monorepo**: npm workspaces (`packages/*`)

### Frontend (`@gestionale/frontend` v0.1.0)
- **React** `^18.3.0` con JSX transform
- **Vite** `^6.1.0` (dev server porta 5173, proxy `/api` → backend)
- **Tailwind CSS** `^3.4.0` + PostCSS `^8.5.0` + Autoprefixer `^10.4.0`
- **React Router DOM** `^7.1.0` (installato, non ancora configurato)
- Path alias: `@` → `src/`

### Backend (`@gestionale/backend` v0.1.0)
- **Express** `^4.21.0` (porta 3001)
- **Prisma** `^6.3.0` + `@prisma/client` `^6.3.0` (PostgreSQL)
- **Sicurezza**: Helmet `^8.0.0`, CORS `^2.8.5`, bcryptjs `^2.4.3`
- **Auth**: jsonwebtoken `^9.0.2` (JWT access + refresh tokens)
- **Validazione**: Zod `^3.24.0`
- **Dev Runtime**: tsx `^4.19.0` (watch mode)

### Shared (`@gestionale/shared` v0.1.0)
- **Zod** `^3.24.0`
- Esporta tipi TypeScript + validatori (Partita IVA, Codice Fiscale, CAP, Provincia)

### Testing
- **Vitest** `^3.0.0` (globals, environment: node, coverage: v8)
- **Supertest** `^7.0.0` (HTTP assertion backend)
- **Playwright** (installato, non configurato)

## Structure

```
gestionale_riparazioni-main/
├── .claude/commands/           # Comandi Claude (project-startup, story-pipeline)
├── _archive_django/            # Vecchio progetto Django (riferimento, non in build)
├── _bmad/bmm/workflows/        # Pipeline framework BMAD
│   ├── 0-project-startup/      # Pipeline setup progetto (8 step)
│   └── 4-implementation/       # Story pipeline v2 (10 step)
├── docs/                       # Documentazione (stories, sprint-artifacts)
├── e2e/                        # Playwright tests (vuoto)
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point Express
│   │   │   ├── routes/health.ts # GET /api/health
│   │   │   └── middleware/auth.ts # JWT authenticate + authorize RBAC
│   │   └── prisma/schema.prisma # Schema DB
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx        # Entry point React
│   │   │   ├── App.tsx         # Root component (placeholder)
│   │   │   └── index.css       # Tailwind imports
│   │   ├── vite.config.ts      # Proxy /api, alias @, porta 5173
│   │   └── tailwind.config.js  # Content: src/**/*.{ts,tsx}
│   └── shared/
│       └── src/
│           ├── types/index.ts      # User, Cliente, Fornitore, AuditLog, enums
│           └── validators/index.ts # P.IVA, CF, CAP, Provincia
├── .env.example                # DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN
├── tsconfig.base.json          # Base config (strict, ES2022)
└── vitest.config.ts            # Config globale test
```

## Patterns

### Architettura Generale
**Monorepo TypeScript full-stack** con 3 package:
- **backend**: API REST Express con architettura layered (routes → middleware → Prisma)
- **frontend**: React SPA component-based
- **shared**: Libreria utility con tipi e validatori condivisi (DRY)

### Backend Pattern
- **Layered**: Express routes → middleware (auth/authorize) → Prisma data layer
- **RBAC**: Role-Based Access Control con JWT (ruoli: ADMIN, TECNICO, COMMERCIALE)
- **Security-first**: Helmet, CORS, bcryptjs per password hashing

### Frontend Pattern
- **Component-Based SPA**: React functional components
- **Utility-First CSS**: Tailwind CSS
- **Proxy Pattern**: Vite dev proxy per evitare CORS in dev

### Shared Pattern
- **Named exports** per tree-shaking
- **Zod validators** per validazione runtime + type inference

## Entry Points & Routing

### Backend
- **Entry**: `packages/backend/src/index.ts`
- **Middleware stack**: Helmet → CORS → express.json() → routes
- **Routes attive**: `GET /api/health` (health check)
- **Middleware auth** (definito, non montato):
  - `authenticate()`: Verifica JWT Bearer, popola `req.user`
  - `authorize(...roles)`: Factory middleware per RBAC

### Frontend
- **Entry**: `packages/frontend/src/main.tsx` → `ReactDOM.createRoot`
- **Root**: `App.tsx` (placeholder "Applicazione in fase di sviluppo")
- **Routing**: React Router DOM installato, non configurato
- **API Proxy**: `/api` → `http://localhost:3001` (Vite config)

## Database

### ORM & Provider
- **Prisma** `^6.3.0` con **PostgreSQL**
- Schema: `packages/backend/prisma/schema.prisma`

### Modelli

| Modello | Campi Chiave | Relazioni |
|---------|-------------|-----------|
| **User** | id, username (unique), email (unique), password, role (ADMIN/TECNICO/COMMERCIALE) | → AuditLog (1:N) |
| **Cliente** | id, codiceCliente (unique), tipologia (PRIVATO/AZIENDA), nome, cognome, ragioneSociale, P.IVA, CF, indirizzo, città, CAP, provincia, telefono, email, note | nessuna |
| **Fornitore** | id, codiceFornitore (unique), categoria (RICAMBI/SERVIZI/ALTRO), nome, cognome, ragioneSociale, P.IVA, CF, indirizzo, città, CAP, provincia, telefono, email, note | nessuna |
| **AuditLog** | id, userId (FK nullable), action, modelName, objectId, timestamp | → User (N:1) |

### Enums
- `Role`: ADMIN, TECNICO, COMMERCIALE
- `TipoCliente`: PRIVATO, AZIENDA
- `CategoriaFornitore`: RICAMBI, SERVIZI, ALTRO

### Stato Migrazioni
Nessuna migration presente. Schema definito ma non ancora applicato al database.

### Origine Modelli
Convertiti dal vecchio Django (`_archive_django/`):
- Django `BaseAnagrafica` (abstract model) → campi duplicati in Cliente e Fornitore (Prisma non ha abstract models)
- Django validators → Zod validators in `@gestionale/shared`
- Django signals (audit) → da implementare come middleware Express

## Testing

### Framework
- **Vitest** `^3.0.0` configurato globalmente (`vitest.config.ts`)
- Pattern: `packages/*/src/**/*.{test,spec}.ts`
- Coverage: v8, reporter text + lcov

### Stato Attuale
- **0 test implementati** (framework pronto, nessun file test)
- **Supertest** disponibile per test API backend
- **Playwright** installato ma non configurato (directory `e2e/` vuota)

## CI/CD

**Nessuna pipeline CI/CD configurata.**
- No `.github/workflows/`
- No `.gitlab-ci.yml`
- No altri file CI

## Configuration

### Environment Variables (`.env.example`)
| Variabile | Scopo | Default |
|-----------|-------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:password@host:5432/gestionale_riparazioni` |
| `JWT_SECRET` | Secret JWT access token | (da configurare) |
| `JWT_REFRESH_SECRET` | Secret JWT refresh token | (da configurare) |
| `PORT` | Porta backend | `3001` |
| `CORS_ORIGIN` | Origin frontend per CORS | `http://localhost:5173` |
| `NODE_ENV` | Ambiente | `development` |

### TypeScript
- Base config: `tsconfig.base.json` (strict, ES2022, ESNext modules)
- Ogni package estende la base con opzioni specifiche
- Frontend: `jsx: "react-jsx"`, `noEmit: true`

## Business Logic Prevista

### Workflow Riparazioni (Avanzato)
Il gestionale gestisce il ciclo di vita completo di una riparazione con:

**Stati riparazione:**
1. **Ricevuta** - Dispositivo consegnato dal cliente, registrazione dati
2. **In diagnosi** - Tecnico valuta il problema
3. **Preventivo emesso** - Preventivo creato e inviato al cliente
4. **In attesa approvazione** - Attesa conferma cliente sul preventivo
5. **Approvata** - Cliente accetta, si procede
6. **In attesa ricambi** - Ordine ricambi a fornitori
7. **In lavorazione** - Tecnico esegue la riparazione
8. **Completata** - Riparazione terminata, in attesa ritiro/pagamento
9. **Consegnata** - Dispositivo restituito al cliente
10. **Annullata** - Riparazione annullata (cliente rifiuta preventivo o altro)

**Caratteristiche workflow:**
- Assegnazione a tecnico specifico
- Gestione priorità (urgente, normale, bassa)
- Preventivi con approvazione cliente
- Tracciamento ricambi utilizzati
- Storico interventi per dispositivo/cliente

### Modello Riparazione (da definire in Prisma)
Campi previsti: id, codiceRiparazione, clienteId, tecnicoId, dispositivo (tipo, marca, modello, seriale), descrizioneProblema, diagnosi, stato, priorità, preventivo, costoFinale, dataRicezione, dataCompletamento, dataConsegna, note

### Preventivi e Fatturazione
- **Preventivi**: Creazione preventivo da riparazione, invio al cliente, approvazione/rifiuto
- **Fatturazione**: Generazione fatture da riparazioni completate, storico pagamenti
- **Metodi pagamento**: Contanti, carta, bonifico

### Magazzino Ricambi
- **Inventario**: Gestione articoli ricambi con giacenze, prezzo acquisto/vendita
- **Movimenti**: Carico (da fornitore), scarico (per riparazione), reso
- **Ordini fornitori**: Creazione ordini d'acquisto, tracking arrivo
- **Soglie minime**: Alert quando giacenza sotto soglia

### Dashboard e Reportistica
- **Dashboard**: Riparazioni in corso per stato, statistiche giornaliere/settimanali
- **KPI tecnici**: Tempo medio riparazione, riparazioni completate, tasso successo
- **Report finanziari**: Fatturato, incassi, preventivi emessi/approvati
- **Report magazzino**: Valore giacenze, articoli più utilizzati, ordini in corso

## Integrazioni Esterne Previste

### Email/SMS
- **Notifiche cliente**: Aggiornamenti automatici stato riparazione (ricevuta, pronta, ecc.)
- **Invio preventivi**: Email con preventivo PDF allegato
- **Promemoria**: Reminder ritiro dispositivo completato

### Stampa
- **Etichette**: Stampa etichetta identificativa da apporre sul dispositivo (codice riparazione, QR code)
- **Ricevute**: Stampa ricevuta accettazione dispositivo
- **Preventivi PDF**: Generazione PDF preventivo
- **Fatture PDF**: Generazione PDF fattura

### Pagamenti
- **Gateway pagamento**: Integrazione con Stripe o altro provider per pagamenti online
- **Link pagamento**: Invio link pagamento al cliente via email/SMS

## Stato del Progetto

### Completato
- Setup monorepo npm workspaces
- TypeScript strict mode
- Prisma schema (User, Cliente, Fornitore, AuditLog)
- Express setup + middleware JWT
- React + Vite + Tailwind setup
- Shared library (tipi + validatori)
- Health check endpoint

### Parziale
- Auth JWT (middleware definito, non montato su route)
- Testing (framework configurato, 0 test)

### Da Implementare
- Modello Riparazione + stati + workflow completo
- Route CRUD (clienti, fornitori, utenti, riparazioni)
- Auth endpoints (login, register, refresh)
- Frontend UI (login, dashboard, CRUD forms, workflow riparazioni)
- Modulo preventivi e fatturazione
- Modulo magazzino ricambi
- Dashboard e reportistica
- Integrazioni email/SMS
- Generazione PDF (etichette, ricevute, preventivi, fatture)
- Integrazione gateway pagamento
- Database migrations + seed
- Audit log middleware
- CI/CD pipeline
- Test suite completa
