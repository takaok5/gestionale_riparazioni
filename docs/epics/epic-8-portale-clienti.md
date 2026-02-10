# Epic 8: Portale Cliente (FR-015)

Area riservata per i clienti finali, con autenticazione dedicata e consultazione autonoma di ordini, riparazioni, preventivi e documenti.

## Story 8.1: Attivazione Account Portale Cliente

**As a** Commerciale, **I want** to enable portal access for an existing customer, **so that** they can view their orders and repairs online.

### Acceptance Criteria
- **AC-1:** Given cliente id=5 has email "cliente@test.it" and no portal account When I POST /api/clienti/5/portal-account Then account is created with stato INVITATO and activation email is sent, I receive 201
- **AC-2:** Given cliente id=5 already has active portal account When I POST /api/clienti/5/portal-account Then I receive 409 with error "PORTAL_ACCOUNT_ALREADY_EXISTS"
- **AC-3:** Given cliente id=5 has null email When I POST /api/clienti/5/portal-account Then I receive 400 with error "CUSTOMER_EMAIL_REQUIRED"
- **AC-4:** Given activation token is valid and not expired When customer sets password Then stato becomes ATTIVO and first login is allowed

**Complexity:** M

**Dependencies:** none

---

## Story 8.2: Login, Refresh e Logout Portale Cliente

**As a** Cliente, **I want** to authenticate securely in the portal, **so that** I can access my private data.

### Acceptance Criteria
- **AC-1:** Given portal account email "cliente@test.it" and valid password When I POST /api/portal/auth/login Then I receive 200 with accessToken, refreshToken, and customer profile summary
- **AC-2:** Given invalid password for an existing account When I POST /api/portal/auth/login Then I receive 401 with error "INVALID_CREDENTIALS"
- **AC-3:** Given 10 failed attempts from same IP/account in 15 minutes When another login attempt is made Then I receive 423 "ACCOUNT_TEMPORARILY_LOCKED"
- **AC-4:** Given valid refresh token When I POST /api/portal/auth/refresh Then I receive new accessToken and refreshToken, old refresh token invalidated
- **AC-5:** Given I am authenticated in portal When I POST /api/portal/auth/logout Then portal refresh token is revoked and I receive 200

**Complexity:** M

**Dependencies:** 8.1

---

## Story 8.3: Dashboard Cliente

**As a** Cliente, **I want** to see a personal dashboard with key counters, **so that** I immediately know what requires action.

### Acceptance Criteria
- **AC-1:** Given customer id=5 has 2 open orders, 1 active repair, and 1 pending quote When I GET /api/portal/me Then response contains stats { ordiniAperti: 2, riparazioniAttive: 1, preventiviInAttesa: 1 }
- **AC-2:** Given customer has no active items When I GET /api/portal/me Then stats counters are returned as zero values (not null)
- **AC-3:** Given customer has recent events (status changes, new invoice) When I GET /api/portal/me Then response includes latest events sorted by descending timestamp
- **AC-4:** Given unauthenticated request When I GET /api/portal/me Then I receive 401 "Unauthorized"

**Complexity:** S

**Dependencies:** 8.2

---

## Story 8.4: Lista e Dettaglio Ordini Cliente

**As a** Cliente, **I want** to view my orders and their status, **so that** I can track progress without calling support.

### Acceptance Criteria
- **AC-1:** Given customer id=5 has 12 orders When I GET /api/portal/ordini?page=1&limit=10 Then I receive 10 items and pagination metadata
- **AC-2:** Given orders with states IN_ATTESA and IN_LAVORAZIONE exist When I GET /api/portal/ordini?stato=IN_LAVORAZIONE Then I receive only orders in that state
- **AC-3:** Given order id=20 belongs to authenticated customer When I GET /api/portal/ordini/20 Then I receive detail with stato, importi, timeline, and linked documents
- **AC-4:** Given order id=20 belongs to another customer When I GET /api/portal/ordini/20 Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** 8.2

---

## Story 8.5: Lista e Dettaglio Riparazioni Cliente

**As a** Cliente, **I want** to view my repairs with status history, **so that** I can follow every step of the repair process.

### Acceptance Criteria
- **AC-1:** Given customer id=5 has 3 repairs When I GET /api/portal/riparazioni Then I receive all 3 with current stato and basic device details
- **AC-2:** Given repairs in IN_DIAGNOSI and COMPLETATA exist When I GET /api/portal/riparazioni?stato=IN_DIAGNOSI Then I receive only diagnostics-phase repairs
- **AC-3:** Given repair id=10 belongs to authenticated customer When I GET /api/portal/riparazioni/10 Then I receive full detail with timeline and linked quote/invoice ids
- **AC-4:** Given repair id=10 does not belong to authenticated customer When I GET /api/portal/riparazioni/10 Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** 8.2

---

## Story 8.6: Approvazione o Rifiuto Preventivo dal Portale

**As a** Cliente, **I want** to approve or reject my quote online, **so that** the repair can continue without manual phone confirmation.

### Acceptance Criteria
- **AC-1:** Given preventivo id=5 belongs to my repair and stato is INVIATO When I POST /api/portal/preventivi/5/risposta with { approvato: true } Then preventivo becomes APPROVATO, riparazione becomes APPROVATA, I receive 200
- **AC-2:** Given preventivo id=5 belongs to my repair and stato is INVIATO When I POST /api/portal/preventivi/5/risposta with { approvato: false } Then preventivo becomes RIFIUTATO, riparazione becomes ANNULLATA, I receive 200
- **AC-3:** Given preventivo id=5 already has stato APPROVATO When I POST /api/portal/preventivi/5/risposta Then I receive 400 with error "RESPONSE_ALREADY_RECORDED"
- **AC-4:** Given preventivo id=5 belongs to another customer When I POST /api/portal/preventivi/5/risposta Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** 8.5

---

## Story 8.7: Download Documenti dal Portale Cliente

**As a** Cliente, **I want** to download my quote, invoice, and receipt PDFs, **so that** I can keep personal records.

### Acceptance Criteria
- **AC-1:** Given invoice id=8 belongs to authenticated customer When I GET /api/portal/documenti/fattura/8/pdf Then I receive application/pdf with correct filename
- **AC-2:** Given quote id=5 belongs to authenticated customer When I GET /api/portal/documenti/preventivo/5/pdf Then I receive application/pdf with correct filename
- **AC-3:** Given requested document id belongs to another customer When I GET /api/portal/documenti/fattura/8/pdf Then I receive 403 "FORBIDDEN"
- **AC-4:** Given unauthenticated request When I GET /api/portal/documenti/preventivo/5/pdf Then I receive 401 "Unauthorized"

**Complexity:** S

**Dependencies:** 8.2

---
