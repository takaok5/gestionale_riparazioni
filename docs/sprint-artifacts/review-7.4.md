# Review 7.4

### Issue 1: Test PDF stream length hardcoded
Status: RESOLVED

Hardcoded `/Length 240` in the test PDF stream could invalidate the PDF when field values change length, causing parsers to misread the stream.
Fix: compute stream length dynamically and set `/Length` accordingly in `packages/backend/src/services/riparazioni-etichetta-pdf.ts`.

### Issue 2: Cliente label ignores ragioneSociale
Status: RESOLVED

`resolveClienteLabel` only considered `nome` and fell back directly to `codiceCliente`, ignoring `ragioneSociale` for business customers.
Fix: prefer `ragioneSociale` when `nome` is empty before falling back to `codiceCliente` in `packages/backend/src/services/riparazioni-service.ts`.

### Issue 3: CLAUDE.md missing new core dependencies
Status: RESOLVED

Root `CLAUDE.md` did not mention the new PDF/QR dependencies, leaving operational docs stale.
Fix: add `PDFKit` and `qrcode` to the Stack section in `CLAUDE.md`.

### Issue 4: QR payload not uniquely verified in ATDD
Status: RESOLVED

The ATDD only asserted that `codiceRiparazione` appears in the PDF, which would still pass even if the QR payload were wrong because the same value is also printed as text.
Fix: assert the dedicated QR payload marker `QR:${codiceRiparazione}` in `packages/backend/src/__tests__/riparazioni-etichetta-atdd.spec.ts`.

### Issue 5: Codice cliente pattern mismatch (4 vs 6 digits)
Status: RESOLVED

AC-2 and its test description referenced `CLI-0005`, but the system uses 6-digit codes (e.g., `CLI-000005`) and the test constant already follows that pattern.
Fix: update the story AC-2 and the test name to use `CLI-000005` so the spec matches the system pattern.
