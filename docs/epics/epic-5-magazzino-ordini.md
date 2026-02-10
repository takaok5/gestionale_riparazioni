# Epic 5: Magazzino e Ordini (FR-007, FR-008)

Sistema di inventory management con movimenti di carico/scarico, alert scorte, e gestione ordini fornitori.

## Story 5.1: Creazione Articolo Magazzino

**As an** Admin, **I want** to create inventory items, **so that** I can track parts and manage stock.

### Acceptance Criteria
- **AC-1:** Given I am Admin When I POST /api/articoli with { codiceArticolo: "LCD-SAMS21", nome: "Display Samsung S21", descrizione: "LCD originale", categoria: "DISPLAY", fornitoreId: 3, prezzoAcquisto: 100.00, prezzoVendita: 150.00, sogliaMinima: 5 } Then articolo is created with initial giacenza 0, I receive 201
- **AC-2:** Given articolo with codiceArticolo "LCD-SAMS21" exists When I POST /api/articoli with same codiceArticolo Then I receive 409 with error "CODICE_ARTICOLO_EXISTS"
- **AC-3:** Given I am Admin When I POST /api/articoli with prezzoVendita 80.00 less than prezzoAcquisto 100.00 Then I receive 400 with validation error "prezzoVendita must be greater than prezzoAcquisto"
- **AC-4:** Given I am Tecnico When I POST /api/articoli Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** none

---

## Story 5.2: Lista e Ricerca Articoli

**As a** Tecnico, **I want** to search inventory and view low-stock alerts, **so that** I can find parts and know what needs reordering.

### Acceptance Criteria
- **AC-1:** Given 30 articoli exist When I GET /api/articoli?page=1&limit=20 Then I receive 200 with data array of 20 articoli and meta { page: 1, limit: 20, total: 30 }
- **AC-2:** Given articoli exist When I GET /api/articoli?search=Samsung Then I receive articoli matching "Samsung" in nome, codiceArticolo, or descrizione fields
- **AC-3:** Given articolo id=5 has giacenza 3 and sogliaMinima 5, articolo id=7 has giacenza 10 and sogliaMinima 5 When I GET /api/articoli/alert Then I receive only articolo id=5 where giacenza <= sogliaMinima
- **AC-4:** Given articoli with various categorie exist When I GET /api/articoli?categoria=DISPLAY Then I receive only articoli with categoria DISPLAY

**Complexity:** S

**Dependencies:** 5.1

---

## Story 5.3: Movimenti Magazzino

**As a** Tecnico, **I want** to record stock movements, **so that** inventory quantities are accurate.

### Acceptance Criteria
- **AC-1:** Given articolo id=5 has giacenza 10 When I POST /api/articoli/5/movimenti with { tipo: "CARICO", quantita: 20, riferimento: "Ordine FOR-000001" } Then giacenza becomes 30, movimento is recorded with userId and timestamp, I receive 201
- **AC-2:** Given articolo id=5 has giacenza 30 When I POST /api/articoli/5/movimenti with { tipo: "SCARICO", quantita: 15, riferimento: "Riparazione RIP-20260209-0001" } Then giacenza becomes 15
- **AC-3:** Given articolo id=5 has giacenza 5 When I POST /api/articoli/5/movimenti with { tipo: "SCARICO", quantita: 10 } Then I receive 400 with error "Insufficient stock: available 5, requested 10"
- **AC-4:** Given articolo id=5 has giacenza 15 When I POST /api/articoli/5/movimenti with { tipo: "RETTIFICA", quantita: -5, riferimento: "Inventario fisico" } Then giacenza becomes 10
- **AC-5:** Given concurrent SCARICO requests for articolo id=5 When both try to reduce stock simultaneously Then only one succeeds, the other receives 400 "Insufficient stock" due to atomic transaction

**Complexity:** M

**Dependencies:** 5.1, 5.2

---

## Story 5.4: Collegamento Ricambi a Riparazione

**As a** Tecnico, **I want** to assign parts to a repair, **so that** parts used are tracked and inventory is updated.

### Acceptance Criteria
- **AC-1:** Given articolo id=5 has giacenza 15 and prezzoVendita 150.00 When I POST /api/riparazioni/10/ricambi with { articoloId: 5, quantita: 2 } Then ricambio is linked to riparazione, giacenza becomes 13, prezzoUnitario 150.00 is recorded at time of use, automatic SCARICO movimento created, I receive 201
- **AC-2:** Given articolo id=5 has giacenza 1 When I POST /api/riparazioni/10/ricambi with { quantita: 3 } Then I receive 400 with error "Insufficient stock for articolo: available 1, requested 3"
- **AC-3:** Given riparazione id=10 has ricambi linked When I GET /api/riparazioni/10 Then response includes ricambi array with { articolo: { id, nome, codiceArticolo }, quantita, prezzoUnitario }
- **AC-4:** Given articolo id=999 does not exist When I POST /api/riparazioni/10/ricambi with { articoloId: 999 } Then I receive 404 with error "ARTICOLO_NOT_FOUND"

**Complexity:** M

**Dependencies:** 5.3

---

## Story 5.5: Creazione Ordine Fornitore

**As an** Admin, **I want** to create supplier orders, **so that** I can replenish inventory.

### Acceptance Criteria
- **AC-1:** Given I am Admin When I POST /api/ordini with { fornitoreId: 3, voci: [{ articoloId: 5, quantitaOrdinata: 10, prezzoUnitario: 100.00 }, { articoloId: 7, quantitaOrdinata: 5, prezzoUnitario: 80.00 }] } Then ordine is created with stato BOZZA, totale 1400.00 (10*100 + 5*80), auto-generated numeroOrdine, I receive 201
- **AC-2:** Given I am Admin When I POST /api/ordini with fornitoreId=999 (non-existent) Then I receive 404 with error "FORNITORE_NOT_FOUND"
- **AC-3:** Given I am Admin When I POST /api/ordini with voce having articoloId=999 Then I receive 404 with error "ARTICOLO_NOT_FOUND in voce"
- **AC-4:** Given I am Tecnico When I POST /api/ordini Then I receive 403 "FORBIDDEN"

**Complexity:** M

**Dependencies:** none

---

## Story 5.6: Gestione Stato Ordine

**As an** Admin, **I want** to track order status through its lifecycle, **so that** I know order progress.

### Acceptance Criteria
- **AC-1:** Given ordine id=12 has stato BOZZA When I PATCH /api/ordini/12/stato with { stato: "EMESSO" } Then ordine.stato becomes EMESSO, dataEmissione is set, I receive 200
- **AC-2:** Given ordine stato is EMESSO When I PATCH /api/ordini/12/stato with { stato: "CONFERMATO" } Then stato becomes CONFERMATO
- **AC-3:** Given ordine stato is CONFERMATO When I PATCH /api/ordini/12/stato with { stato: "SPEDITO" } Then stato becomes SPEDITO
- **AC-4:** Given ordine stato is SPEDITO When I PATCH /api/ordini/12/stato with { stato: "RICEVUTO" } Then stato becomes RICEVUTO, dataRicezione is set
- **AC-5:** Given ordine stato is BOZZA When I PATCH /api/ordini/12/stato with { stato: "ANNULLATO" } Then stato becomes ANNULLATO
- **AC-6:** Given ordine stato is CONFERMATO and I am Admin When I PATCH /api/ordini/12/stato with { stato: "ANNULLATO" } Then stato becomes ANNULLATO (admin override)
- **AC-7:** Given ordine stato is SPEDITO and I am not Admin When I PATCH /api/ordini/12/stato with { stato: "ANNULLATO" } Then I receive 400 with error "Cannot cancel order in SPEDITO state"

**Complexity:** M

**Dependencies:** 5.5

---

## Story 5.7: Ricezione Ordine e Carico Magazzino

**As an** Admin, **I want** to record order receipt and automatically update inventory, **so that** stock levels reflect received goods.

### Acceptance Criteria
- **AC-1:** Given ordine id=12 has voci [{ articoloId: 5, quantitaOrdinata: 10 }, { articoloId: 7, quantitaOrdinata: 5 }] and articolo 5 has giacenza 3, articolo 7 has giacenza 8 When I POST /api/ordini/12/ricevi with { voci: [{ articoloId: 5, quantitaRicevuta: 10 }, { articoloId: 7, quantitaRicevuta: 5 }] } Then articolo 5 giacenza becomes 13, articolo 7 giacenza becomes 13, automatic CARICO movimenti created, ordine.stato becomes RICEVUTO, I receive 200
- **AC-2:** Given ordine with 2 voci When I POST /api/ordini/12/ricevi with partial receipt { voci: [{ articoloId: 5, quantitaRicevuta: 6 }] } Then only articolo 5 receives CARICO of 6, ordine.stato remains SPEDITO (not all voci received)
- **AC-3:** Given ordine with 2 voci, first voce already received When I POST /api/ordini/12/ricevi with { voci: [{ articoloId: 7, quantitaRicevuta: 5 }] } Then second voce is received, all voci now complete, ordine.stato becomes RICEVUTO
- **AC-4:** Given ordine stato is BOZZA When I POST /api/ordini/12/ricevi Then I receive 400 with error "Cannot receive order in BOZZA state"

**Complexity:** M

**Dependencies:** 5.5, 5.6

---
