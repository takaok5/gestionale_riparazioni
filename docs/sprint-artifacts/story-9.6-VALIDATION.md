# Story 9.6 Validation

## Issues Found

1. **AC-1 not fully testable**
Problem: AC-1 required unique title/description but did not define concrete expected title values per route.
Fix applied: Added explicit title expectations for `/`, `/servizi/sostituzione-display`, `/contatti`, `/faq`, `/richiedi-preventivo`.
Verification: AC-1 now contains deterministic strings directly translatable to `expect(document.title).toBe(...)`.

2. **AC-2 canonical URL ambiguity**
Problem: AC-2 used relative canonical URL and did not define environment base URL behavior.
Fix applied: Added `PUBLIC_SITE_URL` with fallback `http://localhost:5173` and required canonical/`og:url` to use the resolved base URL.
Verification: AC-2 now specifies exact source of canonical host and exact OG title format.

3. **AC-3 content corruption and weak negative check**
Problem: Story text had a malformed slug token and no explicit negative assertion for inactive slug omission.
Fix applied: Corrected slug token to `riparazione-legacy` and required sitemap exclusion of `/servizi/riparazione-legacy`.
Verification: AC-3 now has explicit include/exclude assertions for sitemap entries.

4. **AC-4 placeholder-style sitemap reference**
Problem: AC-4 used generic `{public-base-url}` placeholder, not directly implementable/testable.
Fix applied: Replaced with explicit base URL resolution rule (`PUBLIC_SITE_URL` fallback) and exact robots directives.
Verification: AC-4 now maps to exact line assertions in plain text response.

## Checklist Verification

- [x] Read complete story file
- [x] Found at least 3 real issues
- [x] Described problem + fix + verification for each issue
- [x] Applied fixes to story file
- [x] Wrote RESEARCH artifact (`docs/sprint-artifacts/story-9.6-RESEARCH.md`)
- [x] ACs testable with specific data
- [x] Task breakdown covers all ACs
- [x] No TODO/TBD/PLACEHOLDER/FIXME in story
