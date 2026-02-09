# Step 5: Epic Details

## Goal
Detail every epic with stories in BDD format. This step produces the DIRECT INPUT for story-pipeline-v2.

## Context Load
- `docs/prd.md` (Epic List section)
- `docs/architecture.md` (technical context)
- `_bmad/bmm/workflows/0-project-startup/templates/epic-details.tmpl.md`

---

## CRITICAL: Output Format

The output format MUST be compatible with `/story-pipeline`. Every story MUST follow this exact format.

**NOTE:** story-pipeline-v2 (step 3) transforms AC from inline format (used here) to expanded format
with `**Given**`/`**When**`/`**Then**` on separate lines. This document uses compact inline format
for readability; the transformation happens automatically during story file creation.

```markdown
# Epic N: [Name]

## Story N.M: [Title]

**As a** [role], **I want** [action], **so that** [benefit]

### Acceptance Criteria

- **AC-1:** Given [context] When [action] Then [result]
- **AC-2:** Given [context] When [action] Then [result]
- **AC-3:** Given [context] When [action] Then [result]

### Complexity: [S|M|L|XL]

### Dependencies: [none | story references]
```

---

## Task 5.1: Context Load

1. Read `docs/prd.md` section "## Epic List"
2. Read `docs/architecture.md` for technical context (stack, data models, API)
3. Read template `templates/epic-details.tmpl.md`

## Task 5.2: Extract Epic List

From the PRD, extract:
- Number and name of each Epic
- FR covered by each Epic
- Priority of each Epic

## Task 5.3: Generate Stories per Epic (with Elicitation)

For EVERY Epic (in priority order):

### 5.3.1: Generate Breakdown

> **RULE:** "Given a valid user" is NOT acceptable. Specify WHAT makes the user "valid".
> **RULE:** Every Then must be translatable to an `expect()`. If you can't, it's too vague.

1. For the current Epic, generate a story breakdown
2. Every story MUST have:
   - **ID:** format `{epic}.{story}` (e.g. 1.1, 1.2, 2.1)
   - **Title:** format "As a... I want... So that..."
   - **Acceptance Criteria:** minimum 3, Given/When/Then format
   - **Complexity:** S/M/L/XL
   - **Dependencies:** references to other stories or "none"
3. Verify that all FR of the Epic are covered by at least 1 story

### 5.3.2: Elicitation per Epic

**NOTE:** Elicitation is PER EPIC, not per individual story. This reduces the number of interactions.

```
AskUserQuestion({
  questions: [{
    question: "Generated {N} stories for Epic {n}: {name}. Review the breakdown:",
    header: "Epic Review",
    options: [
      { label: "Approve epic", description: "Stories are correct and complete" },
      { label: "Add stories", description: "Missing stories for uncovered functionality" },
      { label: "Modify AC", description: "Some AC are imprecise or missing" },
      { label: "Reorganize", description: "Stories need to be split/merged differently" }
    ],
    multiSelect: false
  }]
})
```

### 5.3.3: Iterate (max 3 per Epic)

If the user requests changes, apply and re-present.

## STOP_AND_VERIFY (Before writing)

Before writing `docs/epic-details.md`:
1. **LIST the sources** for each Epic:
   - Epic N -> Source: `docs/prd.md` section "Epic List" -> Epic N
   - Stories of Epic N -> Source: FR covered by the Epic (list by ID)
   - AC of each Story -> Source: specific FR + User Flow from `docs/prd.md`
2. For each AC: "Derived from FR-{id}" or "NO SOURCE -> ask"
3. **If even ONE AC doesn't map to an FR -> AskUserQuestion BEFORE writing**
4. DO NOT invent generic AC like "Given a valid user When they perform action Then it works"
5. Every AC must contain SPECIFIC data (field names, concrete values, exact messages)

## Task 5.4: Write Artifact

Write `docs/epic-details.md` with:
1. All Epics with their stories
2. Summary table at the end

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 6, you MUST have completed ALL of these:

```
[] Read docs/prd.md section "Epic List"
[] Every Epic in the PRD has a corresponding section in epic-details.md
[] For EVERY story:
  [] Has ID format N.M (e.g. 1.1, 2.3)
  [] Has user story "As a [role] I want [action] so that [benefit]"
  [] Has at least 3 AC in Given/When/Then format
  [] Every AC is SPECIFIC (concrete data, not "valid data")
  [] Has Complexity (S/M/L/XL)
  [] Has Dependencies
[] Every AC maps to a FR in the PRD (verified)
[] AC are UNIQUE (>= 80% are not copy-paste between stories)
[] NO TODO, TBD, PLACEHOLDER present
[] Wrote docs/epic-details.md
[] Ran the gate script - PASSES
```

**If even ONE is unchecked -> DO NOT proceed.**

---

## Update State

```yaml
currentStep: 6
completedSteps:
  - step: 5
    completed: "{timestamp}"
    artifact: docs/epic-details.md
artifacts:
  epicDetails: docs/epic-details.md
```

## CONTEXT CHECK (Rule 12)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `startup-state.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compaction, RE-READ `startup-state.yaml` + current step and resume

## Gate: gate-epic-details-complete

```bash
# File exists
test -f docs/epic-details.md || exit 1

# Every Epic in PRD has a corresponding section
EPIC_COUNT_PRD=$(grep -c "^### Epic [0-9]" docs/prd.md)
EPIC_COUNT_DETAILS=$(grep -c "^# Epic [0-9]" docs/epic-details.md)
[ "$EPIC_COUNT_DETAILS" -ge "$EPIC_COUNT_PRD" ] || { echo "FAIL: epic mismatch PRD=$EPIC_COUNT_PRD details=$EPIC_COUNT_DETAILS"; exit 1; }

# Every story has at least 3 AC (Given/When/Then)
# Count stories and AC (specific pattern: only AC lines with BDD format)
STORY_COUNT=$(grep -c "^## Story [0-9]" docs/epic-details.md)
AC_COUNT=$(grep -c "^\- \*\*AC-[0-9].*Given.*When.*Then" docs/epic-details.md)
# Minimum 3 AC per story
EXPECTED_MIN_AC=$((STORY_COUNT * 3))
[ "$AC_COUNT" -ge "$EXPECTED_MIN_AC" ] || { echo "FAIL: insufficient AC. Stories=$STORY_COUNT, AC=$AC_COUNT, minimum=$EXPECTED_MIN_AC"; exit 1; }

# Story ID format present (N.M)
grep -q "^## Story [0-9]\+\.[0-9]\+" docs/epic-details.md || { echo "FAIL: story ID format not found"; exit 1; }

# No placeholder (specific pattern to avoid false positives)
grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\{TODO\}|\{TBD\}" docs/epic-details.md && { echo "FAIL: placeholder found"; exit 1; }

# Quality check: AC uniqueness >= 80% (no copy-paste between stories)
TOTAL_AC=$(grep -c "^\- \*\*AC-[0-9]" docs/epic-details.md || echo 0)
UNIQUE_AC=$(grep "^\- \*\*AC-[0-9]" docs/epic-details.md | sed 's/\*\*AC-[0-9]\+:\*\* //' | sort -u | wc -l)
if [ "$TOTAL_AC" -gt 0 ]; then
  UNIQUE_PCT=$((UNIQUE_AC * 100 / TOTAL_AC))
  if [ "$UNIQUE_PCT" -lt 80 ]; then
    echo "WARN: Only $UNIQUE_PCT% of AC are unique ($UNIQUE_AC/$TOTAL_AC). Possible copy-paste."
  fi
fi

echo "Gate passed: $EPIC_COUNT_DETAILS epics, $STORY_COUNT stories, $AC_COUNT AC"
```

## FORBIDDEN ANTI-PATTERNS

- Do not write AC without reading the corresponding FR
- Do not use "valid data" or "correct response" in AC - specify concrete data
- Do not copy identical AC between different stories
- Do not assign the same Complexity to all stories without evaluation
- Do not skip the sad path - every story with user input MUST have at least 1 error AC

## COMMON MISTAKES (Avoid these)

1. **Non-testable AC ("Then the system works correctly"):** Every Then MUST have a VERIFIABLE result with concrete data (HTTP code, exact message, specific state).
2. **Copy-paste AC between stories:** If 3 stories share identical AC, the stories likely need merging or the AC are too generic. At least 80% of AC must be UNIQUE.
3. **Vague Given ("Given a valid user"):** Specify WHAT makes the user "valid" - e.g. "Given a user with email 'test@example.com' and role 'admin'".
4. **Missing sad path:** Every story with user input MUST have at least 1 AC for the error case (invalid input, missing permissions, resource not found).
5. **Complexity always "M":** If all stories share the same complexity, you haven't evaluated seriously. Vary based on number of AC, dependencies, and components involved.

## Routing

After gate passed:
- Read and execute: `steps/step-06-validation.md`
