# Review 4.2

## Scope
- Diff reviewed for story 4.2 on backend route/service/tests and story artifacts.

### Issue 1: Missing negative-path coverage for PUT not-found
Status: RESOLVED

- Problem: update tests covered BOZZA/INVIATO/APPROVATO but did not assert contract for non-existing preventivo id.
- Risk: route mapping NOT_FOUND -> PREVENTIVO_NOT_FOUND could regress silently.
- Fix: added regression tests in packages/backend/src/__tests__/preventivi-update-atdd.spec.ts:237 and packages/backend/src/__tests__/preventivi-update-atdd.spec.ts:257.
- Verification: full suite passes and asserts 404 + error.code = PREVENTIVO_NOT_FOUND.

### Issue 2: Test helper accepted arbitrary status values
Status: RESOLVED

- Problem: setPreventivoStatoForTests allowed any string, enabling typo states and fragile tests.
- Risk: tests could pass with invalid setup not representative of domain states.
- Fix: added allowed-state guard in packages/backend/src/services/preventivi-service.ts:797.
- Verification: helper now throws INVALID_STATO_FOR_TESTS on invalid values, normal scenarios still pass.

### Issue 3: Success-path tests did not verify status invariance
Status: RESOLVED

- Problem: AC-1/AC-2 tests validated totals and voci but not that stato remains BOZZA after edit.
- Risk: accidental status mutation could slip through while tests stay green.
- Fix: added assertions esponse.body?.stato === "BOZZA" in packages/backend/src/__tests__/preventivi-update-atdd.spec.ts:60 and packages/backend/src/__tests__/preventivi-update-atdd.spec.ts:113.
- Verification: targeted and full tests are green.

## Task Evidence
- [x] PUT route + HTTP mapping: packages/backend/src/routes/preventivi.ts:103, packages/backend/src/routes/preventivi.ts:166.
- [x] Service update logic: packages/backend/src/services/preventivi-service.ts:559, packages/backend/src/services/preventivi-service.ts:593, packages/backend/src/services/preventivi-service.ts:717.
- [x] Replace voci persistence: packages/backend/src/services/preventivi-service.ts:624 (nested deleteMany + create).
- [x] ATDD dedicated tests: packages/backend/src/__tests__/preventivi-update-atdd.spec.ts:40.
- [x] Seed/reset fixtures: packages/backend/src/services/preventivi-service.ts:738, packages/backend/src/services/preventivi-service.ts:797.
- [x] Router bootstrap regression check: full suite green including pre-existing preventivi POST/GET tests.

## Gate Checks
- npm test -- --run: PASS
- npm run lint: PASS
- false positives in story tasks: none
- CLAUDE/config maintenance: no new significant directories, CLAUDE.md unchanged, _bmad/bmm/config.yaml paths verified valid.

Generated: 2026-02-12T03:50:39.0350021+01:00
