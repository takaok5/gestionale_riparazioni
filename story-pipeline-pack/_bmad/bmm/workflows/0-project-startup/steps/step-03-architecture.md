# Step 3: Architecture

## Goal
Define the system's technical architecture.

## Context Load
- `docs/prd.md` (FR, NFR, Epic List)
- `_bmad/bmm/workflows/0-project-startup/templates/architecture.tmpl.md`
- `_bmad/bmm/workflows/0-project-startup/data/tech-preferences.md`
- `docs/codebase-analysis.md` (brownfield only)

---

## Mode Routing

Read `startup-state.yaml` field `mode`:
- If `greenfield` -> execute **Section A**
- If `brownfield` -> execute **Section B**

---

## Section A: Greenfield - Architecture Design (Full Elicitation)

### Task 3A.1: Context Load

1. Read `docs/prd.md` (FR, NFR, Epic List)
2. Read template `templates/architecture.tmpl.md`
3. Read `data/tech-preferences.md` for default preferences

### Task 3A.2: Generate Architecture with Elicitation

For EACH section, in order:

**Max 3 iterations per section** - then force-proceed with warning.

#### 3A.2.1: Tech Stack

> **RULE:** Every tech choice MUST be justified against an FR or NFR. "It's popular" is NOT a justification.

1. Based on FR and NFR, propose tech stack
2. Use `data/tech-preferences.md` as starting point
3. Justify each choice against requirements
4. Elicitation Menu (Approve / Brainstorming / Competitor / Deep dive)

#### 3A.2.2: Project Structure
1. Generate directory tree based on chosen stack
2. Describe each directory's role
3. Elicitation Menu

#### 3A.2.3: Data Models
1. OPEN `docs/prd.md`, READ section "## Functional Requirements"
2. For EACH FR: identify mentioned data entities (names, objects, resources)
3. For EACH entity found: define fields with SPECIFIC type (string, number, boolean, Date, enum - NOT "{type}")
4. For EACH field: specify constraints (required, unique, default, min/max, regex pattern)
5. VERIFY: every entity maps to at least 1 FR. If an entity maps to no FR -> remove it or ask the user
6. Define relationships between entities (hasMany, belongsTo, manyToMany)
7. Elicitation Menu

#### CHECKPOINT 1/2 (after Tech Stack + Project Structure + Data Models)

Before proceeding, verify:
- Chosen stack is consistent with FR/NFR
- Directory tree covers all required modules
- Data Models map ALL FR that require persistence
- If context exceeds 50% -> save state and write HANDOFF before proceeding

#### 3A.2.4: API Specification (if backend)
1. Map FR to API endpoints
2. Define method, path, request/response, error codes
3. Reference FR for each endpoint
4. Elicitation Menu

#### 3A.2.5: Component Architecture (if frontend)
1. Define component hierarchy
2. State management strategy
3. Elicitation Menu

#### 3A.2.6: Testing Strategy
1. Define framework per level (unit, integration, E2E)
2. Coverage target
3. Naming convention for tests
4. Elicitation Menu

#### CHECKPOINT 2/2 (after API + Component Architecture + Testing Strategy)

Before proceeding, verify:
- Every API endpoint maps to an FR (coverage)
- Component hierarchy covers all User Flows from PRD
- Testing strategy covers all required levels
- If context exceeds 50% -> save state and write HANDOFF before proceeding

#### 3A.2.7: Coding Standards
1. Naming conventions
2. Mandatory patterns
3. Forbidden anti-patterns
4. Elicitation Menu

#### 3A.2.8: FR Coverage Map

> **RULE:** If an FR does not appear in the coverage map, the architecture is INCOMPLETE. 100% coverage required.

1. For each FR in the PRD, indicate the component/module implementing it
2. Verify EVERY FR is covered
3. If FR not covered -> flag it and ask how to resolve

### STOP_AND_VERIFY (Before writing)

Before writing `docs/architecture.md`:
1. **LIST sources** for each section:
   - Tech Stack -> Source: `data/tech-preferences.md` + FR/NFR from `docs/prd.md` + user approval
   - Project Structure -> Source: chosen stack (approved) + standard framework patterns
   - Data Models -> Source: FR from `docs/prd.md` (EVERY entity must map to an FR)
   - API Specification -> Source: FR from `docs/prd.md` (EVERY endpoint must map to an FR)
   - Component Architecture -> Source: FR from `docs/prd.md` + User Flows
   - Testing Strategy -> Source: NFR from `docs/prd.md` + chosen stack
   - Coding Standards -> Source: chosen stack + user approval
   - FR Coverage Map -> Source: `docs/prd.md` FR section (ALL FR must appear)
2. For each section: write "Source: {file/section}" or "NO SOURCE -> ask"
3. **If even ONE section has no source -> AskUserQuestion BEFORE writing**
4. DO NOT invent fields/types/endpoints without basis in FR

### Task 3A.3: Write Artifact

Write `docs/architecture.md` with all approved sections.

---

## Section B: Brownfield - Reverse Engineering (Elicitation)

### Task 3B.1: Context Load

1. Read `docs/codebase-analysis.md`
2. Read `docs/prd.md`
3. Read template `templates/architecture.tmpl.md`

### Task 3B.2: Deep Scan with Opus Subagent

Launch subagent for in-depth analysis:

```
Task({
  description: "Architectural deep scan",
  subagent_type: "Explore",
  prompt: "Perform an in-depth analysis of this project's architecture:

  1. **Database schema:** Find schema files (prisma/schema.prisma, migrations, models), document all entities and relationships
  2. **API Routes:** Find all endpoints (express routes, fastapi routes, etc.), document method + path + handler
  3. **Component Tree:** If frontend, map the full component hierarchy
  4. **State Management:** How state is managed (Redux, Context, Zustand, etc.)
  5. **Test Setup:** Framework, config files, patterns used

  Format as structured markdown."
})
```

### Task 3B.3: Reconstruct Architecture

Using the subagent output + codebase-analysis, reconstruct the architecture document following the template.

### Task 3B.4: Section Elicitation

For each section of the reconstructed architecture (**max 3 iterations per section** - then force-proceed with warning):

```
AskUserQuestion({
  questions: [{
    question: "I reconstructed the '{section}' section from code. Is it correct?",
    header: "Review",
    options: [
      { label: "Approve and proceed", description: "The section is correct" },
      { label: "Corrections", description: "There are errors to fix" },
      { label: "Additions", description: "Important aspects are missing" },
      { label: "Deep dive", description: "Expand with more technical details" }
    ],
    multiSelect: false
  }]
})
```

### STOP_AND_VERIFY (Before writing)

Before writing `docs/architecture.md`:
1. **LIST sources** for each section:
   - Tech Stack -> Source: `docs/codebase-analysis.md` (technologies found in code)
   - Data Models -> Source: database/ORM schema found in code
   - API Specification -> Source: routes/endpoints found in code
   - Component Architecture -> Source: components found in code
2. For each section: write "Source: {file/section}" or "NO SOURCE -> ask"
3. **If even ONE section has no source -> AskUserQuestion BEFORE writing**
4. DO NOT invent architecture not present in the analyzed code

### Task 3B.5: Write Artifact

Write `docs/architecture.md` with all validated sections.

---

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 4, you MUST have completed ALL of these:

```
[] Read docs/prd.md (FR, NFR, Epic List)
[] Tech stack approved by user
[] Data Models derived from FR (EVERY entity maps to an FR)
[] Every field has SPECIFIC type (not generic "string" without constraints)
[] API Specification: EVERY endpoint maps to an FR
[] FR Coverage Map: ALL FR from PRD covered (100%)
[] Every section approved by user via elicitation
[] NO TODO, TBD, PLACEHOLDER in the document
[] Wrote docs/architecture.md
[] Ran the gate script - PASSES
```

**If even ONE is unchecked -> DO NOT proceed.**

## Update State

```yaml
currentStep: 4
completedSteps:
  - step: 3
    completed: "{timestamp}"
    artifact: docs/architecture.md
artifacts:
  architecture: docs/architecture.md
```

## CONTEXT CHECK (Rule 12)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `startup-state.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compaction, RE-READ `startup-state.yaml` + current step and resume

## Gate: gate-architecture-complete

```bash
# File exists
test -f docs/architecture.md || exit 1

# Contains Tech Stack
grep -q "## Tech Stack" docs/architecture.md || exit 1

# Contains Data Models
grep -q "## Data Models" docs/architecture.md || exit 1

# FR Coverage: every FR from PRD referenced
# Extract FR IDs from PRD
FR_IDS=$(grep -oE "FR-[0-9]+" docs/prd.md | sort -u)
for FR in $FR_IDS; do
  grep -q "$FR" docs/architecture.md || { echo "FAIL: $FR not covered in architecture"; exit 1; }
done

# No placeholder (specific pattern to avoid false positives)
grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\{TODO\}|\{TBD\}" docs/architecture.md && exit 1

echo "Gate passed"
```

## FORBIDDEN ANTI-PATTERNS

- Do not choose tech stack "because it's popular" without justification against FR/NFR
- Do not define Data Models with generic types ("{type}") - every field must have a specific type
- Do not leave FR without coverage in the FR Coverage Map (must be 100%)
- Do not invent API endpoints that map to no FR
- Do not copy project structure from template without adapting it to the chosen stack

## Routing

After gate passed:
- Read and execute: `steps/step-04-frontend-spec.md`
