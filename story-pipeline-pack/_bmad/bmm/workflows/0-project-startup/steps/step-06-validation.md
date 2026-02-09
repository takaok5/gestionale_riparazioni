# Step 6: Validation

## Goal
Cross-validation of consistency across ALL produced artifacts.

## Context Load
**ALL artifacts** (only step that loads everything):
- `docs/project-brief.md` (greenfield) OR `docs/codebase-analysis.md` (brownfield)
- `docs/prd.md`
- `docs/architecture.md`
- `docs/frontend-spec.md` (if exists)
- `docs/epic-details.md`

---

## Task 6.1: Coverage Map FR -> Epic -> Story

For each FR in the PRD:
1. Find the Epic that references it
2. Find the Stories in the Epic that implement it
3. Create coverage table

**Output format:**

| FR | Title | Epic | Stories | Status |
|----|-------|------|---------|--------|
| FR-001 | {title} | Epic 1 | 1.1, 1.2 | COVERED |
| FR-002 | {title} | Epic 1 | 1.3 | COVERED |
| FR-003 | {title} | Epic 2 | 2.1 | COVERED |

**If an FR has no stories -> CRITICAL. Flag immediately.**

## Task 6.2: Coverage Map NFR -> Architecture

For each NFR in the PRD:
1. Verify the architecture addresses it
2. Identify which architecture section/decision covers the NFR

| NFR | Title | Architecture Section | Status |
|-----|-------|---------------------|--------|
| NFR-001 | {title} | Testing Strategy | COVERED |
| NFR-002 | {title} | Tech Stack | COVERED |

**If an NFR is not addressed -> MINOR. Flag but do not block.**

## Task 6.3: Consistency Check

Verify consistency across artifacts:

### 6.3.1: Tech Stack Consistency
- Tech stack in `architecture.md` == framework in `frontend-spec.md` (if exists)
- If mismatch -> CRITICAL

### 6.3.2: Data Model Consistency
- Entities in `architecture.md` == entities referenced in stories
- If entity in stories not defined in architecture -> CRITICAL

### 6.3.3: API Consistency
- API endpoints in `architecture.md` == user flows in PRD
- Every user flow must be supported by existing endpoints
- If endpoint missing -> CRITICAL

### 6.3.4: Component Consistency (if frontend)
- Components in `frontend-spec.md` == component tree in `architecture.md`
- If mismatch -> MINOR

## Task 6.4: Completeness Check

For EVERY artifact:
1. **No empty sections:** Verify each section has content
2. **No broken references:** Verify every reference (FR-xxx, NFR-xxx, Story x.y) points to something that exists
3. **No placeholders:** grep TODO/TBD/PLACEHOLDER across all artifacts
4. **Testable AC:** Verify each AC in epic-details.md has complete Given/When/Then

## Task 6.5: Issue Resolution

For each issue found:

**CRITICAL Issue (blocks pipeline):**
1. Flag to user with specific details
2. Propose fix
3. Request approval:
```
AskUserQuestion({
  questions: [{
    question: "Critical issue found: {description}. How do you want to proceed?",
    header: "Issue",
    options: [
      { label: "Apply fix", description: "Apply the proposed fix: {fix}" },
      { label: "Manual fix", description: "I prefer to specify how to resolve it" },
      { label: "Re-run step", description: "Go back to the step that generated the problematic artifact" }
    ],
    multiSelect: false
  }]
})
```
4. Apply fix and re-verify

**MINOR Issue (non-blocking):**
1. Auto-fix
2. Mark in report as "auto-fixed"

## Task 6.6: Write Validation Report

Write `docs/validation-report.md` with:

```markdown
# Validation Report

## Coverage Map: FR -> Stories

| FR | Title | Epic | Stories | Status |
|----|-------|------|---------|--------|
| ... | ... | ... | ... | ... |

**FR Coverage:** {X}% ({N}/{M} FR covered)

## Coverage Map: NFR -> Architecture

| NFR | Title | Section | Status |
|-----|-------|---------|--------|
| ... | ... | ... | ... |

**NFR Coverage:** {X}% ({N}/{M} NFR addressed)

## Consistency Checks

| Check | Status | Notes |
|-------|--------|-------|
| Tech Stack | PASS/FAIL | {details} |
| Data Models | PASS/FAIL | {details} |
| API Endpoints | PASS/FAIL | {details} |
| Components | PASS/FAIL | {details} |

## Completeness Checks

| Artifact | Empty Sections | Placeholders | Broken Refs |
|----------|---------------|-------------|-------------|
| project-brief.md | 0 | 0 | 0 |
| prd.md | 0 | 0 | 0 |
| architecture.md | 0 | 0 | 0 |
| frontend-spec.md | 0 | 0 | 0 |
| epic-details.md | 0 | 0 | 0 |

## Issues Found

| # | Severity | Description | Artifact | Resolution |
|---|----------|-------------|----------|------------|
| 1 | CRITICAL | {desc} | {file} | {how resolved} |
| 2 | MINOR | {desc} | {file} | Auto-fixed |

## Resolution Log

{Detail of how each issue was resolved}

## Final Status

- **FR Coverage:** 100%
- **Critical Issues:** 0
- **Auto-fixed Issues:** {N}
- **All artifacts pass no-TODO check:** YES
```

---

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 7, you MUST have completed ALL of these:

```
[] Loaded ALL artifacts (brief/analysis, prd, architecture, frontend-spec, epic-details)
[] Coverage Map FR -> Stories: 100% of FR covered
[] Coverage Map NFR -> Architecture: verified
[] Consistency check Tech Stack: architecture == frontend-spec
[] Consistency check Data Models: entities architecture == entities stories
[] Consistency check API: endpoints architecture == user flows PRD
[] Completeness check: no empty sections in any artifact
[] No broken references (FR-xxx, NFR-xxx, Story x.y all valid)
[] No placeholders in any artifact
[] All CRITICAL issues resolved (with user approval)
[] Wrote docs/validation-report.md
[] Ran the gate script - PASSES
```

**If even ONE is unchecked -> DO NOT proceed.**

## Update State

```yaml
currentStep: 7
completedSteps:
  - step: 6
    completed: "{timestamp}"
    artifact: docs/validation-report.md
artifacts:
  validationReport: docs/validation-report.md
```

## CONTEXT CHECK (Rule 12)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `startup-state.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compacted. After compact, RE-READ `startup-state.yaml` + current step and resume

## Gate: gate-validation-complete

```bash
# File exists
test -f docs/validation-report.md || exit 1

# --- INDEPENDENT VERIFICATION (do not trust the report alone) ---

# FR Coverage: every FR in the PRD must appear in epic-details.md
FR_IDS=$(grep -oE "FR-[0-9]+" docs/prd.md | sort -u)
for FR in $FR_IDS; do
  grep -q "$FR" docs/epic-details.md || { echo "FAIL: $FR not covered in epic-details.md"; exit 1; }
done
echo "Independent verification: all FR covered"

# Every story in epic-details.md has at least 3 AC
STORY_COUNT=$(grep -c "^## Story [0-9]" docs/epic-details.md)
AC_COUNT=$(grep -c "^\- \*\*AC-[0-9].*Given.*When.*Then" docs/epic-details.md)
EXPECTED_MIN_AC=$((STORY_COUNT * 3))
[ "$AC_COUNT" -ge "$EXPECTED_MIN_AC" ] || { echo "FAIL: insufficient AC ($AC_COUNT < $EXPECTED_MIN_AC)"; exit 1; }

# No placeholders in ANY artifact
for doc in docs/project-brief.md docs/prd.md docs/architecture.md docs/epic-details.md; do
  if [ -f "$doc" ]; then
    grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\{TODO\}|\{TBD\}" "$doc" && { echo "FAIL: placeholder in $doc"; exit 1; }
  fi
done
if [ -f docs/frontend-spec.md ]; then
  grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\{TODO\}|\{TBD\}" docs/frontend-spec.md && { echo "FAIL: placeholder in docs/frontend-spec.md"; exit 1; }
fi

# --- REPORT VERIFICATION (format) ---

# 0 unresolved critical issues
grep -qE "Critical Issues.*: 0$" docs/validation-report.md || { echo "FAIL: unresolved critical issues"; exit 1; }

echo "Gate passed"
```

## FORBIDDEN ANTI-PATTERNS

- Do not declare "0 issues" without actually verifying each check
- Do not trust your own report without independent verification (the gate performs independent verification)
- Do not resolve critical issues with "auto-fix" without user approval
- Do not ignore uncovered FR ("will be added later")
- Do not validate only structure (sections present) without validating content (specific data)

## Routing

After gate passed:
- Read and execute: `steps/step-07-scaffold.md`
