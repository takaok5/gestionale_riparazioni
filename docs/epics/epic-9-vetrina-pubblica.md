# Epic 9: Vetrina Pubblica e Lead Capture (FR-016)

Sito pubblico per presentare servizi del centro riparazioni e convertire visitatori in richieste qualificate.

## Story 9.1: Home Pubblica Vetrina

**As a** Visitor, **I want** a clear homepage with service highlights and calls to action, **so that** I can quickly understand what the workshop offers.

### Acceptance Criteria
- **AC-1:** Given I open route `/` When page loads Then I see hero section, service highlights, trust blocks, and CTA "Richiedi preventivo"
- **AC-2:** Given I open homepage on mobile width 390px When content renders Then layout is fully responsive with no horizontal overflow
- **AC-3:** Given homepage assets are optimized When Lighthouse performance runs Then score is >= 85 on mobile profile
- **AC-4:** Given I click CTA "Accedi al portale cliente" When navigation occurs Then I am redirected to `/portale/login`

**Complexity:** M

**Dependencies:** none

---

## Story 9.2: Catalogo Servizi Pubblico

**As a** Visitor, **I want** to browse available repair services, **so that** I can understand price ranges and expected times.

### Acceptance Criteria
- **AC-1:** Given 8 active services exist When I GET /api/public/services Then I receive 8 service cards with slug, title, summary, priceFrom, and averageDuration
- **AC-2:** Given services contain categories "smartphone" and "laptop" When I GET /api/public/services?categoria=smartphone Then I receive only smartphone-related entries
- **AC-3:** Given service slug `sostituzione-display` exists When I open `/servizi/sostituzione-display` Then I see full service detail page
- **AC-4:** Given service is marked inactive When I request its public slug Then I receive 404

**Complexity:** M

**Dependencies:** 9.1

---

## Story 9.3: Pagine Contatti e FAQ

**As a** Visitor, **I want** contact and FAQ pages, **so that** I can clarify doubts before submitting a request.

### Acceptance Criteria
- **AC-1:** Given I open `/contatti` Then page displays phone, email, opening hours, and map/embed placeholder
- **AC-2:** Given I open `/faq` Then I see categorized questions with expandable answers
- **AC-3:** Given contact details are updated in backoffice/public config Then both pages reflect updated data without code change
- **AC-4:** Given I navigate from home to FAQ and back Then navigation remains consistent and breadcrumb/title are correct

**Complexity:** S

**Dependencies:** 9.1

---

## Story 9.4: Form Richiesta Preventivo/Appuntamento Pubblico

**As a** Visitor, **I want** to submit a quote or appointment request online, **so that** I can be contacted by the workshop.

### Acceptance Criteria
- **AC-1:** Given I submit valid payload to POST /api/public/richieste with { tipo: "PREVENTIVO", nome: "Mario Rossi", email: "mario@test.it", problema: "Display rotto", consensoPrivacy: true } Then I receive 201 with ticketId "LEAD-20260210-0001"
- **AC-2:** Given required field `consensoPrivacy` is false or missing When request is submitted Then I receive 400 with validation error
- **AC-3:** Given too many requests from same IP in short interval When POST /api/public/richieste is called Then I receive 429
- **AC-4:** Given anti-spam token is invalid When request is submitted Then I receive 400 with error "INVALID_ANTISPAM_TOKEN"

**Complexity:** M

**Dependencies:** 9.1

---

## Story 9.5: Backoffice Lead Management

**As a** Commerciale, **I want** to manage incoming public requests, **so that** I can convert them into customers and repair jobs.

### Acceptance Criteria
- **AC-1:** Given 30 public requests exist When I GET /api/richieste?page=1&limit=20 Then I receive paginated list with stato, tipo, contatto, createdAt
- **AC-2:** Given richiesta id=12 is NUOVA When I PATCH /api/richieste/12/stato with { stato: "IN_LAVORAZIONE" } Then state changes and audit log is created
- **AC-3:** Given I am Commerciale and richiesta id=12 is unassigned When I PATCH /api/richieste/12/assegna with my user id Then richiesta becomes assigned to me
- **AC-4:** Given I am Tecnico (no commerciale/admin role) When I GET /api/richieste Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** 9.4

---

## Story 9.6: SEO, Metadata e Sitemap

**As a** Business owner, **I want** public pages optimized for search engines, **so that** potential customers can discover services organically.

### Acceptance Criteria
- **AC-1:** Given I open any public page Then HTML contains unique title and meta description tags
- **AC-2:** Given I open service detail page Then page includes canonical URL and Open Graph metadata
- **AC-3:** Given I request `/sitemap.xml` Then response includes public routes and active service slugs
- **AC-4:** Given I request `/robots.txt` Then public crawl policy is returned with sitemap reference

**Complexity:** S

**Dependencies:** 9.2, 9.3

---

## Story 9.7: Conversione Lead in Cliente + Pratica

**As a** Commerciale, **I want** to convert a qualified lead into customer and repair/order record, **so that** no manual re-entry is required.

### Acceptance Criteria
- **AC-1:** Given richiesta id=12 has valid contact data and does not match existing customer When I POST /api/richieste/12/converti Then new Cliente is created and richiesta stato becomes CONVERTITA
- **AC-2:** Given richiesta id=12 matches existing customer by email/phone When I POST /api/richieste/12/converti Then existing customer is reused and duplication is avoided
- **AC-3:** Given conversion target is repair flow When conversion succeeds Then Riparazione draft is created with fields pre-filled from richiesta
- **AC-4:** Given richiesta already CONVERTITA When conversion is retried Then I receive 409 with error "REQUEST_ALREADY_CONVERTED"

**Complexity:** M

**Dependencies:** 9.5

---
