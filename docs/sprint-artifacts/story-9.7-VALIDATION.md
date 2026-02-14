# Story 9.7 Validation

## Issues Found

1. **AC-1 used a non-existent lead field**
Problem: AC-1 required `telefono` on public richiesta, but current lead store shape does not include that field.
Fix applied: Rewrote AC-1 Given to use concrete existing fields `nome`, `email`, `problema`, `tipo`, `stato="NUOVA"`.
Verification: Given now matches `TestPublicRichiestaRecord` and is directly reproducible in ATDD fixtures.

2. **AC-2 success assertion was not deterministic**
Problem: AC-2 Then said "returns conversion payload referencing reused cliente" without concrete response keys or cardinality check.
Fix applied: Added explicit assertions: `data.cliente.id` equals pre-existing id and total clienti count does not increase.
Verification: Then is now translatable to concrete `expect()` checks on id equality + count invariance.

3. **AC-3 lacked specific mapping for required riparazione fields**
Problem: AC-3 referenced generic "prefilled fields" while `createRiparazione` requires multiple mandatory fields.
Fix applied: Added exact expected mapping for `descrizioneProblema`, `priorita="NORMALE"`, and non-empty fallback values for required device/accessory fields.
Verification: Then now defines deterministic payload expectations compatible with current service validation rules.

4. **Task coverage for AC-3 pointed to an unrelated test surface**
Problem: Task 6 referenced public-richieste tests, but conversion endpoint lives in backoffice richieste API.
Fix applied: Replaced Task 6 with dedicated conversion ATDD file under backend richieste tests.
Verification: Task breakdown now maps AC-3 to a coherent test target for conversion contract.

## Checklist Verification

- [x] Read complete story file
- [x] Found at least 3 real issues
- [x] Described problem + fix + verification for each issue
- [x] Applied fixes to story file
- [x] Wrote RESEARCH artifact (`docs/sprint-artifacts/story-9.7-RESEARCH.md`)
- [x] ACs testable with specific data
- [x] Task breakdown covers all ACs
- [x] No TODO/TBD/PLACEHOLDER/FIXME in story
