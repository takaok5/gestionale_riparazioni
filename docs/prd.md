# Product Requirements Document: Gestionale Riparazioni

## Background & Goals

### Background

Il progetto nasce dalla necessità di digitalizzare la gestione di un centro riparazioni (elettronica, dispositivi mobili, computer, ecc.), sostituendo processi manuali o basati su fogli di calcolo. Una prima bozza in Django (Python) è stata sviluppata come proof-of-concept ma è stata abbandonata a favore di un'architettura TypeScript full-stack moderna (React + Express + Prisma + PostgreSQL) per:
- **Unified language**: TypeScript su tutta la stack riduce il context-switch e permette condivisione di tipi e validatori tra frontend e backend
- **Developer experience**: Hot-reload con Vite, type safety end-to-end, monorepo npm workspaces
- **Scalabilità futura**: Architettura modulare che consente di aggiungere moduli (magazzino, fatturazione, integrazioni) senza ristrutturare

Il sistema è progettato per uso interno da parte di un team composto da 3 ruoli (Admin, Tecnico, Commerciale) e deve coprire l'intero ciclo di vita: accettazione dispositivo → diagnosi → preventivo → approvazione cliente → ordine ricambi → riparazione → completamento → fatturazione → consegna.

### Goals

1. **Workflow riparazioni completo** - Gestione 10 stati (Ricevuta → Consegnata/Annullata) con transizioni validate, assegnazione tecnico, gestione priorità, preventivi con approvazione cliente, tracciamento ricambi utilizzati. Trade-off: stati predefiniti con transizioni validate, override per Admin.
2. **Gestione anagrafiche (Clienti e Fornitori)** - CRUD completo con validazione dati fiscali italiani (P.IVA, CF, CAP). Distinzione cliente privato/azienda, fornitore per categoria. Storico riparazioni/ordini.
3. **Magazzino ricambi** - Inventario con giacenze, prezzi, movimenti (carico/scarico/reso), ordini fornitori con tracking, alert soglie minime. Gestione base senza logiche di lotto/ubicazione.
4. **Preventivi e fatturazione** - Creazione preventivo (manodopera + ricambi), invio email PDF, approvazione cliente. Generazione fatture, storico pagamenti. Approccio iniziale PDF, evoluzione a fatturazione elettronica (SDI) successiva.
5. **Dashboard e reportistica** - Dashboard operativa personalizzata per ruolo, KPI tecnici e finanziari, report configurabili con export. Aggiornamento al caricamento pagina, senza WebSocket inizialmente.

## Functional Requirements

### FR-001: Autenticazione e Gestione Utenti
- **Priority:** Must Have
- **Description:** Sistema di autenticazione JWT con access + refresh token. Registrazione, login, logout, refresh token rotation. Gestione utenti con ruoli RBAC (Admin, Tecnico, Commerciale). Solo Admin può creare/modificare utenti.
- **User Story:** As an Admin, I want to manage user accounts with role-based access, so that each team member has appropriate permissions for their role.
- **Sub-features:**
  - Login con username/email + password → JWT access token (15min) + refresh token (7d)
  - Refresh token rotation (nuovo refresh ad ogni rinnovo, vecchio invalidato)
  - Logout (invalidazione refresh token lato server)
  - CRUD utenti (solo Admin): creazione, modifica ruolo, disattivazione (soft delete)
  - Password hashing con bcryptjs (salt rounds: 12)
  - Rate limiting login: 5 tentativi/minuto per IP, lockout 15 minuti dopo 10 tentativi
- **Vincoli:** Nessun utente può auto-promuoversi. L'ultimo Admin non può essere disattivato.
- **Notes:** Middleware JWT già definito in `packages/backend/src/middleware/auth.ts`.

### FR-002: Gestione Clienti
- **Priority:** Must Have
- **Description:** CRUD completo clienti (privati e aziende). Validazione dati fiscali italiani. Ricerca e filtro per nome, codice, tipologia. Codice cliente auto-generato univoco.
- **User Story:** As a Commerciale, I want to register and manage customer records with Italian fiscal validation, so that customer data is always accurate and compliant.
- **Sub-features:**
  - Creazione cliente: form con campi obbligatori (nome/ragioneSociale, tipologia) e facoltativi
  - Elenco clienti con paginazione, ordinamento, ricerca (per nome, codice, città)
  - Filtro per tipologia (privato/azienda)
  - Codice cliente auto-generato (formato: CLI-NNNNNN, progressivo)
  - Validazione: P.IVA (11 cifre + check digit), CF (16 alfanumerici), CAP (5 cifre), Provincia (2 lettere)
  - Storico riparazioni per cliente
- **Vincoli:** Cancellazione cliente solo se non ha riparazioni attive (soft delete o blocco).
- **Notes:** Schema Prisma `Cliente` e validatori in `@gestionale/shared` già definiti.

### FR-003: Gestione Fornitori
- **Priority:** Must Have
- **Description:** CRUD completo fornitori con categorizzazione (ricambi, servizi, altro). Stessa validazione fiscale dei clienti. Ricerca e filtro.
- **User Story:** As a Commerciale, I want to manage supplier records categorized by type, so that I can quickly find the right supplier for parts or services.
- **Sub-features:**
  - CRUD analogo a clienti con campo categoria (RICAMBI, SERVIZI, ALTRO)
  - Codice fornitore auto-generato (formato: FOR-NNNNNN)
  - Stessa validazione fiscale di FR-002
  - Lista articoli forniti (collegamento con magazzino)
  - Storico ordini per fornitore
- **Vincoli:** Cancellazione fornitore solo se non ha ordini attivi.
- **Notes:** Schema Prisma `Fornitore` già definito.

### FR-004: Gestione Riparazioni (Workflow Completo)
- **Priority:** Must Have
- **Description:** Creazione, gestione e tracciamento riparazioni con workflow a 10 stati. Assegnazione a tecnico, gestione priorità, registrazione dispositivo. Transizioni di stato validate. Storico cambi stato.
- **User Story:** As a Tecnico, I want to manage repairs through a structured workflow with validated state transitions, so that every repair is tracked from reception to delivery.
- **Sub-features:**
  - Registrazione: cliente, dispositivo (tipo, marca, modello, seriale), descrizione problema, accessori
  - Codice riparazione auto-generato (formato: RIP-YYYYMMDD-NNNN)
  - Assegnazione a tecnico (obbligatoria prima di "In lavorazione")
  - Priorità: urgente, normale, bassa
  - Matrice transizioni stati:
    - Ricevuta → In diagnosi
    - In diagnosi → Preventivo emesso | In lavorazione
    - Preventivo emesso → In attesa approvazione
    - In attesa approvazione → Approvata | Annullata
    - Approvata → In attesa ricambi | In lavorazione
    - In attesa ricambi → In lavorazione
    - In lavorazione → Completata
    - Completata → Consegnata
    - Da qualsiasi stato → Annullata (solo Admin)
  - Storico cambi stato con timestamp e utente
  - Note tecniche per stato
  - Collegamento ricambi utilizzati
- **Vincoli:** Solo tecnico assegnato o Admin possono cambiare stato. Admin può riassegnare.
- **Notes:** Modello `Riparazione` da definire in Prisma.

### FR-005: Gestione Preventivi
- **Priority:** Must Have
- **Description:** Creazione preventivo collegato a riparazione con voci itemizzate. Invio email al cliente con PDF. Gestione approvazione/rifiuto.
- **User Story:** As a Tecnico, I want to create quotes linked to repairs with itemized costs, so that the customer can review and approve before work begins.
- **Sub-features:**
  - Voci preventivo: descrizione, quantità, prezzo unitario, totale voce
  - Tipi voce: manodopera, ricambio (da magazzino), altro
  - Calcolo automatico totale (somma voci + IVA 22%)
  - Aliquota IVA configurabile
  - Generazione PDF con layout professionale
  - Invio email al cliente con PDF allegato
  - Gestione risposta: approvato / rifiutato / scaduto
- **Vincoli:** Preventivo non modificabile dopo invio al cliente (solo nuovo preventivo).

### FR-006: Fatturazione
- **Priority:** Should Have
- **Description:** Generazione fattura da riparazione completata. Registrazione pagamenti. Storico fatture per cliente.
- **User Story:** As a Commerciale, I want to generate invoices from completed repairs and track payments, so that billing is accurate and documented.
- **Sub-features:**
  - Generazione fattura da preventivo approvato (voci precompilate)
  - Numerazione progressiva (formato: YYYY/NNNN)
  - Registrazione pagamento: importo, metodo (contanti, carta, bonifico), data
  - Stato fattura: emessa, pagata, in ritardo
  - Generazione PDF fattura
  - Lista fatture con filtri (periodo, stato, cliente)
- **Vincoli:** Fattura non modificabile dopo emissione. Solo nota di credito per correzioni.

### FR-007: Magazzino Ricambi
- **Priority:** Should Have
- **Description:** Inventario articoli ricambi con giacenze, movimenti di magazzino, alert soglie minime.
- **User Story:** As a Tecnico, I want to manage spare parts inventory with stock levels and automatic alerts, so that I always know what parts are available and when to reorder.
- **Sub-features:**
  - Anagrafica articoli: codice, nome, descrizione, categoria, prezzo acquisto/vendita, fornitore preferito
  - Giacenza: quantità disponibile, soglia minima
  - Movimenti: carico (ricezione ordine), scarico (per riparazione), reso, rettifica (inventario)
  - Alert automatici quando giacenza ≤ soglia minima
  - Storico movimenti per articolo
- **Vincoli:** Scarico non possibile se giacenza insufficiente. Ogni movimento deve avere un riferimento.

### FR-008: Ordini Fornitori
- **Priority:** Should Have
- **Description:** Creazione e tracking ordini d'acquisto a fornitori per ricambi.
- **User Story:** As a Commerciale, I want to create purchase orders to suppliers and track their status, so that spare parts procurement is organized and timely.
- **Sub-features:**
  - Creazione ordine: fornitore, lista articoli con quantità
  - Stati ordine: bozza, emesso, confermato, spedito, ricevuto, annullato
  - Ricezione parziale
  - Carico automatico magazzino alla conferma ricezione
  - Collegamento ordine → riparazione in attesa ricambi
- **Vincoli:** Ordine confermato non annullabile (solo Admin).

### FR-009: Dashboard Operativa
- **Priority:** Should Have
- **Description:** Dashboard con vista riparazioni per stato, carico di lavoro, alert, filtri per periodo.
- **User Story:** As an Admin, I want a real-time operational dashboard showing repair status distribution and technician workload, so that I can monitor the workshop's operations at a glance.
- **Sub-features:**
  - Riepilogo riparazioni per stato (contatori + lista)
  - Riparazioni in scadenza
  - Carico di lavoro per tecnico
  - Ultimi movimenti magazzino
  - Ultimi pagamenti ricevuti
  - Filtro per periodo (oggi, settimana, mese)
- **Vincoli:** Dashboard personalizzata per ruolo (Admin tutto, Tecnico sue riparazioni, Commerciale clienti/fatture).

### FR-010: Reportistica e KPI
- **Priority:** Could Have
- **Description:** Report configurabili con KPI tecnici, finanziari e magazzino. Export.
- **User Story:** As an Admin, I want to generate reports on repair KPIs and financial performance, so that I can make data-driven business decisions.
- **Sub-features:**
  - KPI tecnici: tempo medio per stato, tasso completamento, riparazioni per tecnico
  - KPI finanziari: fatturato, margine, incasso medio
  - KPI magazzino: rotazione, valore giacenza, articoli esauriti
  - Export CSV/Excel
  - Filtri per periodo, tecnico, tipologia

### FR-011: Notifiche Email/SMS
- **Priority:** Could Have
- **Description:** Notifiche automatiche al cliente per cambi stato riparazione. Invio preventivi. Promemoria ritiro.
- **User Story:** As a Cliente (indiretto), I want to receive automatic notifications about my repair status, so that I'm always informed without having to call.
- **Sub-features:**
  - Template notifiche configurabili
  - Trigger automatici: ricezione, preventivo pronto, completata, promemoria ritiro
  - Provider email: SMTP configurabile (SendGrid, Mailgun)
  - Provider SMS: API configurabile (Twilio)
  - Log notifiche inviate

### FR-012: Stampa Documenti
- **Priority:** Could Have
- **Description:** Stampa etichette, ricevute, preventivi e fatture in formato PDF.
- **User Story:** As a Tecnico, I want to print labels and receipts at device reception, so that every device is properly identified and the customer has proof of delivery.
- **Sub-features:**
  - Etichetta dispositivo: codice riparazione (barcode/QR), cliente, dispositivo, data
  - Ricevuta accettazione: dati cliente, dispositivo, accessori, condizioni
  - Formati: PDF A4, formato ridotto per stampanti termiche

### FR-013: Pagamenti Online
- **Priority:** Could Have
- **Description:** Integrazione gateway pagamento per pagamenti online da parte dei clienti.
- **User Story:** As a Commerciale, I want to send payment links to customers, so that they can pay online without coming to the shop.
- **Sub-features:**
  - Integrazione Stripe Checkout / Payment Links
  - Generazione link pagamento da fattura
  - Invio link via email/SMS
  - Webhook per conferma pagamento automatica
  - Registrazione automatica incasso

### FR-014: Audit Trail
- **Priority:** Must Have
- **Description:** Registrazione automatica di tutte le operazioni CRUD con tracciamento utente, azione, modello, ID e timestamp.
- **User Story:** As an Admin, I want a complete audit trail of all system operations, so that I can track who did what and when for accountability.
- **Sub-features:**
  - Logging automatico per ogni operazione CRUD (middleware Express)
  - Campi: userId, action (CREATE/UPDATE/DELETE), modelName, objectId, timestamp, dettagli cambiamento
  - Consultazione log per Admin: filtri per utente, modello, periodo, azione
  - Retention policy: 2 anni
- **Notes:** Schema Prisma `AuditLog` già definito.

## Non-Functional Requirements

### NFR-001: Performance
- **Category:** Performance
- **Requirement:** Tempo di risposta API e rendering frontend
- **Target API:**
  - CRUD semplice: < 200ms p95
  - Liste con paginazione (fino a 50 elementi): < 300ms p95
  - Query aggregate (dashboard, report): < 1000ms p95
  - Upload/download file (PDF): < 2000ms p95
- **Target Frontend:**
  - First Contentful Paint (FCP): < 1.5s
  - Time to Interactive (TTI): < 3s
  - Largest Contentful Paint (LCP): < 2.5s
- **Implementazione:** Indici DB, query Prisma con select specifici, lazy loading React, caching dati statici

### NFR-002: Security
- **Category:** Security
- **Requirement:** Protezione completa del sistema
- **Target Autenticazione:**
  - JWT access token: TTL 15 minuti, HS256
  - JWT refresh token: TTL 7 giorni, rotation, stored in DB (revocabile)
  - Password: bcrypt salt 12, min 8 char, 1 maiuscola + 1 numero
  - Rate limiting: 5 tentativi/min per IP, lockout 15 min dopo 10
- **Target Trasporto:**
  - HTTPS obbligatorio in produzione
  - HSTS max-age ≥ 1 anno
  - Cookie secure + httpOnly + sameSite per refresh token
- **Target Applicazione:**
  - Helmet.js (CSP, X-Frame-Options, X-Content-Type-Options)
  - CORS limitato a origin frontend
  - Input validation Zod su ogni endpoint
  - SQL injection prevenuta da Prisma (prepared statements)
  - XSS prevenuto da React (auto-escape) + CSP

### NFR-003: Usability
- **Category:** Usability
- **Requirement:** UX per operatori non tecnici in ambiente workshop
- **Target Efficienza:**
  - Registrazione nuova riparazione: ≤ 2 minuti
  - Cambio stato riparazione: ≤ 3 click da dashboard
  - Ricerca cliente/riparazione: ≤ 10 secondi (autocomplete)
- **Target Responsive:**
  - Mobile (≥ 375px): consultazione, cambio stato, ricerca
  - Tablet (≥ 768px): tutte le operazioni principali
  - Desktop (≥ 1024px): esperienza completa con tabelle espanse
- **Target Accessibilità:**
  - Font size minimo 14px contenuto, 12px label
  - Contrasto WCAG AA (≥ 4.5:1)
  - Navigazione keyboard per form principali
- **Implementazione:** shadcn/ui, form con tab-order logico e auto-focus, feedback visivo (toast, spinner)

### NFR-004: Reliability
- **Category:** Reliability
- **Requirement:** Continuità operativa e integrità dati
- **Target Disponibilità:**
  - Uptime ≥ 99.5%
  - Manutenzione programmata: finestra notturna (00:00-06:00)
- **Target Integrità:**
  - Transazioni DB atomiche (Prisma transactions)
  - Validazione doppia: frontend (UX) + backend (sicurezza)
- **Target Recovery:**
  - Backup PostgreSQL giornaliero
  - Retention backup: 30 giorni
  - RTO < 4 ore, RPO < 24 ore
- **Target Error Handling:**
  - Formato errori standard: `{ error: { code, message, details } }`
  - Errori non gestiti: logging + notifica admin
  - Circuit breaker per servizi esterni

### NFR-005: Maintainability
- **Category:** Maintainability
- **Requirement:** Codebase sostenibile nel tempo
- **Target Code Quality:**
  - TypeScript strict mode, zero `any` non giustificati
  - Test coverage backend ≥ 80%
  - Test coverage frontend ≥ 60%
  - E2E test per flussi critici
- **Target CI/CD:**
  - Pipeline su ogni PR: lint + typecheck + test + build
  - Deploy staging automatico su merge in main
  - Deploy produzione manuale con approvazione
- **Target Documentation:**
  - API documentata (OpenAPI o equivalente)
  - CLAUDE.md aggiornato

### NFR-006: Scalability
- **Category:** Scalability
- **Requirement:** Crescita utenza e volume dati
- **Target Utenti:** ≥ 10 utenti concorrenti, connection pooling Prisma (10 connections)
- **Target Dati:** ≥ 100.000 record per tabella, indici su filtri/ordinamento, paginazione server-side (default 50, max 100)
- **Target Architettura:** Stateless backend, session state in DB, file storage separato

## User Flows

### Flow 1: Registrazione e Gestione Riparazione (Flusso Principale)

```
1. Commerciale/Tecnico: Accede al sistema (login)
2. Sistema: Mostra dashboard con riparazioni in corso
3. Utente: Clicca "Nuova Riparazione"
4. Sistema: Mostra form registrazione
5. Utente: Seleziona/crea cliente, compila dati dispositivo, descrizione problema, accessori, priorità
6. Sistema: Valida dati, genera codice RIP-YYYYMMDD-NNNN, stato "Ricevuta"
7. Utente: Stampa etichetta + ricevuta accettazione
8. Admin/Tecnico: Assegna a tecnico → stato "In diagnosi"
9. Tecnico: Esegue diagnosi, inserisce note
10. Tecnico: Se serve preventivo → crea preventivo → stato "Preventivo emesso"
11. Sistema: Invia PDF al cliente → stato "In attesa approvazione"
12. Cliente: Approva preventivo
13. Utente: Registra approvazione → stato "Approvata"
14. Se servono ricambi: stato "In attesa ricambi", crea ordine fornitore
15. Ricambi arrivati: stato "In lavorazione"
16. Tecnico: Esegue riparazione, registra ricambi utilizzati
17. Tecnico: "Completata"
18. Sistema: Genera fattura, notifica cliente
19. Commerciale: Registra pagamento
20. Commerciale: Registra consegna → stato "Consegnata"
```

**Happy path:** 1→20 in sequenza.
**Error cases:**
- Passo 5: Validazione fallita → errore specifico, focus campo
- Passo 12: Cliente rifiuta → "Annullata"
- Passo 14: Ricambio non disponibile → contatto cliente per alternativa
- Passo 16: Riparazione non riuscita → nota tecnica, possibile annullamento

### Flow 2: Gestione Magazzino e Ordine Fornitore

```
1. Tecnico: Durante riparazione, necessita ricambio
2. Sistema: Ricerca articolo in magazzino
3a. Disponibile: Associa a riparazione → scarico automatico
3b. Non disponibile: Alert "giacenza insufficiente"
4. Commerciale: Crea ordine a fornitore → riparazione "In attesa ricambi"
5. Fornitore conferma → "Confermato"
6. Ricambio arriva → registra ricezione → carico automatico
7. Tecnico: Procede con riparazione
```

**Happy path:** 1→3a o 1→7.
**Error cases:** Fornitore senza ricambio → alternativa. Articolo danneggiato → reso.

### Flow 3: Login e Onboarding

```
1. Utente: Apre applicazione → pagina login
2. Utente: Inserisce credenziali
3a. Corrette → JWT tokens, redirect dashboard
3b. Errate → messaggio errore, contatore tentativi
3c. Troppi tentativi → blocco 15 minuti
4. Primo accesso → richiesta cambio password
5. Durante sessione → refresh token automatico
6. Refresh scaduto → redirect login
7. Logout → invalidazione token
```

**Error cases:** Tentativi falliti → suggerimento contatto admin. Token revocato → logout forzato.

### Flow 4: Preventivo e Fatturazione

```
1. Tecnico: Da riparazione "In diagnosi" → "Crea Preventivo"
2. Sistema: Form con dati riparazione precompilati
3. Tecnico: Aggiunge voci (manodopera, ricambi, altre spese)
4. Sistema: Calcolo subtotale + IVA = totale
5. Tecnico: Salva → "Bozza"
6. Tecnico: "Invia al cliente" → PDF + email → "In attesa approvazione"
7-9. Approvazione cliente → "Approvata"
10. Post completamento → Commerciale "Genera Fattura"
11. Sistema: Fattura da preventivo, numero YYYY/NNNN
12. Invio fattura email
13-15. Pagamento → registrazione → "Pagata"
```

**Error cases:** Rifiuto → annullamento. Pagamento parziale → saldo residuo. Stripe → automatico.

### Flow 5: Dashboard e Reportistica

```
1. Utente: Accede → dashboard personalizzata per ruolo
2. Admin: Tutte le riparazioni, carico tecnici, alert, fatturato
   Tecnico: Sue riparazioni, prossime in coda
   Commerciale: Clienti, fatture, preventivi in attesa
3. Click contatore → lista filtrata
4. Click riparazione → dettaglio con timeline
5-9. Report: selezione tipo/filtri → generazione → export CSV/Excel
```

### Flow 6: Gestione Ricambi e Fornitori

```
1-4. Nuovo fornitore: form → validazione → codice FOR-NNNNNN → salva
5-8. Nuovo articolo: form → associa fornitore → giacenza iniziale 0
9-12. Carico: ricezione ordine → conferma quantità → carico automatico
13-16. Scarico: da riparazione → ricerca → seleziona → verifica giacenza → scarico
17-19. Alert: controllo periodico → alert dashboard → ordine riapprovvigionamento
```

**Error cases:** P.IVA duplicata → errore. Giacenza insufficiente → blocco + suggerimento ordine.

## Epic List

### Epic 1: Autenticazione e Gestione Utenti
- **Description:** Sistema di autenticazione JWT, gestione ruoli RBAC, CRUD utenti, audit trail
- **FR covered:** FR-001, FR-014
- **Priority:** High

### Epic 2: Gestione Anagrafiche
- **Description:** CRUD clienti e fornitori con validazione dati fiscali italiani
- **FR covered:** FR-002, FR-003
- **Priority:** High

### Epic 3: Gestione Riparazioni
- **Description:** Workflow completo riparazioni con 10 stati, assegnazione tecnici, priorità, storico
- **FR covered:** FR-004
- **Priority:** High

### Epic 4: Preventivi e Fatturazione
- **Description:** Creazione preventivi, approvazione cliente, generazione fatture, registrazione pagamenti
- **FR covered:** FR-005, FR-006
- **Priority:** High

### Epic 5: Magazzino e Ordini
- **Description:** Gestione inventario ricambi, movimenti magazzino, ordini fornitori
- **FR covered:** FR-007, FR-008
- **Priority:** Medium

### Epic 6: Dashboard e Reportistica
- **Description:** Dashboard operativa per ruolo, KPI, report configurabili, export
- **FR covered:** FR-009, FR-010
- **Priority:** Medium

### Epic 7: Notifiche e Integrazioni
- **Description:** Notifiche email/SMS, stampa documenti/etichette, pagamenti online
- **FR covered:** FR-011, FR-012, FR-013
- **Priority:** Low

## Assumptions & Risks

### Assumptions
1. PostgreSQL è disponibile come servizio (locale o cloud) per sviluppo e produzione
2. Il team ha familiarità con TypeScript, React e sviluppo web moderno
3. Il centro riparazioni ha connessione internet stabile per l'uso del sistema
4. I clienti hanno un indirizzo email valido per ricevere preventivi e notifiche
5. L'aliquota IVA standard è 22% (modificabile in configurazione)
6. Il sistema sarà utilizzato da un singolo centro riparazioni (single-tenant)

### Risks
1. **Complessità workflow riparazioni** - Il workflow a 10 stati con transizioni validate potrebbe risultare troppo rigido per casi reali. Mitigation: transizioni configurabili, override Admin, possibilità di aggiungere stati custom in futuro.
2. **Integrazione pagamenti (Stripe)** - Richiede account Stripe verificato e conformità PCI. Mitigation: usare Stripe Checkout (hosted), implementare come ultima Epic.
3. **Generazione PDF** - La generazione di PDF professionali richiede una libreria robusta. Mitigation: valutare Puppeteer (HTML→PDF) o pdfkit (generazione diretta).
4. **Invio email in produzione** - SMTP richiede configurazione SPF/DKIM per evitare spam. Mitigation: usare servizio email transazionale (SendGrid, Mailgun).
5. **Volume dati a lungo termine** - Query aggregate potrebbero rallentare con migliaia di riparazioni/anno. Mitigation: indici, query materializzate, archiviazione dati storici.
6. **Migrazione dati Django** - Se esistono dati nel vecchio sistema, la migrazione potrebbe essere complessa. Mitigation: script dedicato, validazione post-migrazione.

---

_Generated by project-startup pipeline - Step 2: PRD_
