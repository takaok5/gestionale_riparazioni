# Step 4: Frontend Spec (Conditional)

## Goal
Define UI/UX specifications. SKIP if backend-only project.

## Context Load
- `docs/prd.md` (user flows)
- `docs/architecture.md` (components, tech stack)
- `_bmad/bmm/workflows/0-project-startup/templates/frontend-spec.tmpl.md`

---

## Task 4.0: Routing - Check Frontend Necessity

1. Read `docs/architecture.md` Tech Stack section
2. Check if the project includes a frontend:
   - Look for frontend framework mentions (React, Vue, Svelte, Angular, HTMX, etc.)
   - Look for "Component Architecture" section
   - Check if PRD has user flows with UI

3. **If NO frontend:**
   ```
   Inform user: "Backend-only project, skipping Frontend Spec."
   ```
   Update State:
   ```yaml
   frontendSpecStatus: skipped
   ```
   **ROUTING:** Jump to `steps/step-05-epic-details.md`

4. **If YES frontend:** Proceed with sections below.

---

## Mode Routing

- If `greenfield` -> execute **Section A**
- If `brownfield` -> execute **Section B**

---

## Section A: Greenfield - Frontend Spec (Full Elicitation)

### Task 4A.1: Context Load

1. Read `docs/prd.md` (user flows, FR with UI)
2. Read `docs/architecture.md` (Component Architecture, State Management)
3. Read template `templates/frontend-spec.tmpl.md`

### Task 4A.2: Generate Frontend Spec with Elicitation

For EACH section, in order:

**Max 3 iterations per section** - then force-proceed with warning.

#### 4A.2.1: UI Framework & Tools
1. Pick up stack choices from architecture.md
2. Add details on styling, component library, icons, forms
3. Elicitation Menu

#### 4A.2.2: Layout
1. Propose general layout (header, sidebar, main content, footer)
2. Define responsive breakpoints
3. Navigation patterns
4. Elicitation Menu

#### 4A.2.3: Pages / Views
1. For each user flow in the PRD, define a page/view
2. Route, main components, data requirements, user actions
3. Reference FR
4. Elicitation Menu

#### 4A.2.4: Component Hierarchy
1. Expand the component tree from architecture
2. Define shared/reusable components
3. Elicitation Menu

#### 4A.2.5: State Management
1. Detail strategy: client state, server state, form state, URL state
2. Data flow pattern
3. Elicitation Menu

#### 4A.2.6: Responsive Strategy
1. Mobile-first vs desktop-first
2. Touch targets, gestures
3. Progressive enhancement
4. Elicitation Menu

### Task 4A.3: Write Artifact

Write `docs/frontend-spec.md` with all approved sections.

---

## Section B: Brownfield - Frontend Spec Recovery (Elicitation)

### Task 4B.1: Scan UI Components

Use subagent to analyze frontend components:

```
Task({
  description: "Scan frontend components",
  subagent_type: "Explore",
  prompt: "Analyze the frontend components of this project:

  1. **Components:** List all components with their role
  2. **Routing:** Map all routes/pages
  3. **State Management:** How state is managed (store, context, etc.)
  4. **Styling:** CSS/styling framework used
  5. **Layout:** General layout structure
  6. **Shared/Common:** Reusable components

  Format as structured markdown."
})
```

### Task 4B.2: Document Current Structure

Using the scan output, create the frontend spec following the template.

### Task 4B.3: Elicitation for Confirmation

For each section:
```
AskUserQuestion({
  questions: [{
    question: "I've documented the '{section}' frontend section. Is it correct?",
    header: "Review",
    options: [
      { label: "Approve", description: "Documentation is correct" },
      { label: "Corrections", description: "There are errors to fix" },
      { label: "Gaps found", description: "Missing important components/patterns" },
      { label: "Deep dive", description: "Expand with more details" }
    ],
    multiSelect: false
  }]
})
```

### Task 4B.4: Write Artifact

Write `docs/frontend-spec.md`.

---

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 5, you MUST have completed ALL of these:

```
[ ] Checked if the project has a frontend (from architecture.md Tech Stack)
[ ] If NO frontend: updated state with frontendSpecStatus: skipped
[ ] If YES frontend:
  [ ] Read docs/prd.md (user flows, FR with UI)
  [ ] Read docs/architecture.md (Component Architecture)
  [ ] Each page/view maps to a PRD User Flow
  [ ] Component hierarchy covers all components mentioned in architecture.md
  [ ] State management strategy defined
  [ ] Responsive breakpoints defined
  [ ] Each section approved by user via elicitation
  [ ] NO TODO, TBD, PLACEHOLDER present
  [ ] Wrote docs/frontend-spec.md
  [ ] Ran the gate script - PASSES
```

**If even ONE is unchecked -> DO NOT proceed.**

## Update State

```yaml
currentStep: 5
completedSteps:
  - step: 4
    completed: "{timestamp}"
    artifact: docs/frontend-spec.md  # or "skipped"
artifacts:
  frontendSpec: docs/frontend-spec.md  # or null if skipped
frontendSpecStatus: completed  # or "skipped"
```

## CONTEXT CHECK (Rule 12)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `startup-state.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compaction, RE-READ `startup-state.yaml` + current step and resume

## Gate: gate-frontend-spec-complete

**If skipped:**
```bash
grep -q "frontendSpecStatus: skipped" startup-state.yaml && { echo "Gate passed (skipped)"; exit 0; }
```

**If completed:**
```bash
# File exists
test -f docs/frontend-spec.md || exit 1

# Contains mandatory sections
grep -q "## Pages\|## Views\|## Pages / Views" docs/frontend-spec.md || exit 1
grep -q "## Component" docs/frontend-spec.md || exit 1
grep -q "## State Management" docs/frontend-spec.md || exit 1

# No placeholder (specific pattern to avoid false positives)
grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\{TODO\}|\{TBD\}" docs/frontend-spec.md && exit 1

echo "Gate passed"
```

## FORBIDDEN ANTI-PATTERNS

- Do not invent pages/routes unsupported by PRD User Flows
- Do not define components without FR Reference
- Do not choose state management without justifying it against complexity
- Do not copy generic design tokens without user confirmation
- Do not skip responsive strategy for "simplicity" - at minimum define breakpoints

## Routing

After gate passed:
- Read and execute: `steps/step-05-epic-details.md`
