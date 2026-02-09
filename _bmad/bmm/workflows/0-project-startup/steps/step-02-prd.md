# Step 2: PRD (Product Requirements Document)

## Goal
Define functional and non-functional product requirements.

## Context Load
- `docs/project-brief.md` (greenfield) OR `docs/codebase-analysis.md` (brownfield)
- `_bmad/bmm/workflows/0-project-startup/templates/prd.tmpl.md`

---

## Mode Routing

Read `startup-state.yaml` field `mode`:
- If `greenfield` -> execute **Section A**
- If `brownfield` -> execute **Section B**

---

## Section A: Greenfield - PRD from Scratch (Full Elicitation)

### Task 2A.1: Context Load

1. Read `docs/project-brief.md` (Vision, Goals, Scope as context)
2. Read template `templates/prd.tmpl.md`

### Task 2A.2: Generate PRD with Elicitation

For EACH PRD section, in order:

#### 2A.2.1: Background & Goals
1. Generate proposal based on project-brief
2. Elicitation Menu (Approve / Brainstorming / Competitor / Deep dive)
3. Max 3 iterations

#### 2A.2.2: Functional Requirements
1. OPEN `docs/project-brief.md`, READ section "## Goals" and "## Scope > In Scope"
2. For EACH Goal: identify AT LEAST 1 capability needed to achieve it -> becomes an FR
3. For EACH In Scope item: identify if it requires a dedicated FR
4. Each FR MUST have: unique ID (FR-001, FR-002, ...), Title, Priority, Description, User Story
5. User Story MUST use the role from "## Target Users" in the brief (NOT generic "user" if specific roles exist)
6. Elicitation Menu
7. **IMPORTANT:** Generate AT LEAST 3 FR. If the user wants fewer, warn that the gate requires minimum 3.

#### 2A.2.3: Non-Functional Requirements

> **RULE:** "The system must be fast" is NOT an NFR. Each NFR MUST have a measurable NUMERIC target.

1. Generate NFR list based on brief Constraints
2. Each NFR has: ID (NFR-001, NFR-002, ...), Category, Requirement, Target
3. Elicitation Menu
4. **IMPORTANT:** Generate AT LEAST 2 NFR.

#### 2A.2.4: User Flows
1. Generate at least 1 complete user flow (step-by-step)
2. Include happy path and error cases
3. Elicitation Menu

#### 2A.2.5: Epic List

> **RULE:** Epic with only 1 story -> too small. Epic with 10+ stories -> too large. Find the right balance.

1. Group FR into logical Epics
2. Each Epic has: Name, Description, covered FR, Priority
3. Elicitation Menu
4. **IMPORTANT:** At least 1 Epic.

#### 2A.2.6: Assumptions & Risks
1. Generate assumptions and risks list
2. Each risk has a mitigation
3. Elicitation Menu

### STOP_AND_VERIFY (Before writing)

Before writing `docs/prd.md`:
1. **LIST sources** for each section:
   - Background & Goals -> Source: `docs/project-brief.md` Vision/Goals section
   - Functional Requirements -> Source: brief Goals/Scope + user approval
   - Non-Functional Requirements -> Source: brief Constraints + user approval
   - User Flows -> Source: approved FR + implied architecture
   - Epic List -> Source: approved FR grouping
   - Assumptions & Risks -> Source: brief + user context
2. For each section: write "Source: {file/section}" or "NO SOURCE -> ask"
3. **If even ONE section has no source -> AskUserQuestion BEFORE writing**
4. DO NOT fill sections "to the best of your knowledge" - every datum must come from user input or a previous artifact

### Task 2A.3: Write Artifact

Write `docs/prd.md` with all approved sections.

---

## Section B: Brownfield - PRD Recovery from Code (Elicitation)

### Task 2B.1: Context Load

1. Read `docs/codebase-analysis.md`
2. Read template `templates/prd.tmpl.md`

### Task 2B.2: Reconstruct Requirements

Based on the code analysis:

1. **Functional Requirements:** Map each capability found in code to an FR
   - Route/endpoint -> FR
   - UI components -> FR
   - Business logic -> FR
2. **Non-Functional Requirements:** Deduce from configuration and setup
   - Performance config -> NFR performance
   - Auth setup -> NFR security
   - Test setup -> NFR quality
3. **User Flows:** Reconstruct from routing and UI
4. **Epic List:** Group FR by domain/feature area

### Task 2B.3: Elicitation per Section

For EACH reconstructed PRD section:

1. Present proposal based on analyzed code
2. Elicitation Menu:
```
AskUserQuestion({
  questions: [{
    question: "I reconstructed the {section} from code. Are they correct? Is anything missing?",
    header: "Review FR",
    options: [
      { label: "Approve and proceed", description: "Reconstructed requirements are correct" },
      { label: "Corrections", description: "Some requirements are wrong or incomplete" },
      { label: "Add missing", description: "Important requirements not in code are missing" },
      { label: "Deep dive", description: "Expand with details and refinements" }
    ],
    multiSelect: false
  }]
})
```

3. Integrate feedback and iterate (max 3 per section)

### STOP_AND_VERIFY (Before writing)

Before writing `docs/prd.md`:
1. **LIST sources** for each section:
   - Functional Requirements -> Source: `docs/codebase-analysis.md` (routes/endpoints/components found)
   - Non-Functional Requirements -> Source: analyzed project configuration
   - User Flows -> Source: routing and UI found in code
   - Epic List -> Source: FR grouping by domain
2. For each section: write "Source: {file/section}" or "NO SOURCE -> ask"
3. **If even ONE section has no source -> AskUserQuestion BEFORE writing**
4. DO NOT invent requirements not present in the analyzed code

### Task 2B.4: Write Artifact

Write `docs/prd.md` with all validated sections.

---

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 3, you MUST have completed ALL of these:

```
[] Read docs/project-brief.md (or docs/codebase-analysis.md for brownfield)
[] Generated at least 3 FR with unique ID (FR-001, FR-002, ...)
[] Generated at least 2 NFR with unique ID (NFR-001, NFR-002, ...)
[] Each FR has: ID, Title, Priority, Description, User Story
[] User stories are SPECIFIC (not "As a user I want to do things")
[] At least 1 Epic with covered FR
[] Each section was approved by user via elicitation
[] NO TODO, TBD, PLACEHOLDER in the document
[] Wrote docs/prd.md
[] Ran the gate script - PASSES
```

**If even ONE is unchecked -> DO NOT proceed.**

## Update State

```yaml
currentStep: 3
completedSteps:
  - step: 0
    completed: "..."
  - step: 1
    completed: "..."
    artifact: docs/project-brief.md
  - step: 2
    completed: "{timestamp}"
    artifact: docs/prd.md
artifacts:
  prd: docs/prd.md
```

## CONTEXT CHECK (Rule 12)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `startup-state.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compaction, RE-READ `startup-state.yaml` + current step and resume

## Gate: gate-prd-complete

```bash
# File exists
test -f docs/prd.md || exit 1

# At least 3 Functional Requirements
FR_COUNT=$(grep -c "^### FR-[0-9]" docs/prd.md)
[ "$FR_COUNT" -ge 3 ] || exit 1

# At least 2 Non-Functional Requirements
NFR_COUNT=$(grep -c "^### NFR-[0-9]" docs/prd.md)
[ "$NFR_COUNT" -ge 2 ] || exit 1

# Contains Epic List section
grep -q "## Epic List" docs/prd.md || exit 1

# At least 1 Epic
grep -q "### Epic [0-9]" docs/prd.md || exit 1

# No placeholders (specific pattern to avoid false positives)
grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\{TODO\}|\{TBD\}" docs/prd.md && exit 1

# Quality check: warn if all user story roles are generic "user"
ROLES=$(grep -oE "As a [^,]+" docs/prd.md | sed 's/^As a //' | sort -u)
ROLE_COUNT=$(echo "$ROLES" | wc -l)
if [ "$ROLE_COUNT" -le 1 ] && echo "$ROLES" | grep -qi "^user$"; then
  echo "WARN: All roles are generic 'user'. Consider more specific roles (admin, manager, etc.)"
fi

echo "Gate passed: $FR_COUNT FR, $NFR_COUNT NFR found"
```

## FORBIDDEN ANTI-PATTERNS

- Do not write PRD without reading project-brief.md first
- Do not generate FR without basis in brief Goals/Scope
- Do not use "As a user" in all user stories if Target Users defines specific roles
- Do not define NFR without a measurable numeric target
- Do not create Epics with fewer than 2 FR or more than 7 FR

## COMMON MISTAKES (Avoid these)

1. **FR invented without basis in brief:** Each FR MUST derive from a Goal or Scope in the project-brief. If there is no match, ask the user.
2. **Generic user stories ("As a user I want to manage data"):** Each user story must have a SPECIFIC role, SPECIFIC action, MEASURABLE benefit. "As a user" is acceptable only if the system has a single user type.
3. **NFR without numeric target:** "The system must be fast" is NOT an NFR. "Response time < 200ms per API calls" is an NFR. Each NFR MUST have a measurable target.
4. **Epics too large or too small:** An Epic with only 1 story is probably too small (should be a story). An Epic with 10+ stories is too large (split it).
5. **Copy-paste between sections:** If the "Background" section is identical to the brief's "Vision", you are copying without adding value. The PRD must ELABORATE, not repeat.

## Routing

After gate passed:
- Read and execute: `steps/step-03-architecture.md`
