# Step 1: Discovery

## Goal
Gather essential project information.

## Context Load
- **Greenfield:** `templates/project-brief.tmpl.md`
- **Brownfield:** No template (uses Opus subagent for scan)

## Mode Routing

Read `startup-state.yaml` field `mode`:
- If `greenfield` -> execute **Section A**
- If `brownfield` -> execute **Section B**

---

## Section A: Greenfield - Project Brief (Full Elicitation)

### Task 1A.1: Load Template

Read file `_bmad/bmm/workflows/0-project-startup/templates/project-brief.tmpl.md`.

### Task 1A.2: Request Initial Input

```
AskUserQuestion({
  questions: [{
    question: "Describe your project in 2-3 sentences. What do you want to build and why?",
    header: "Vision",
    options: [
      { label: "I'll write it", description: "I'll provide a text description of the project" },
      { label: "Guided interview", description: "I prefer answering specific questions one at a time" }
    ],
    multiSelect: false
  }]
})
```

### Task 1A.3: Generate Project Brief with Elicitation

> **RULE:** Do NOT fill sections with assumptions. If the user has not provided input for a section, ASK -- do not invent.

For EACH template section (Vision, Goals, Target Users, Scope, Constraints):

1. **Generate proposal:** Based on user input, generate content for the section
2. **Present summary:** Show the generated section
3. **Elicitation Menu:**

```
AskUserQuestion({
  questions: [{
    question: "How do you want to proceed with the '{section_name}' section?",
    header: "Elicitation",
    options: [
      { label: "Approve and proceed", description: "Section is complete, move to next" },
      { label: "Brainstorming", description: "Generate 5 divergent alternatives for this section" },
      { label: "Competitor analysis", description: "Compare with similar market solutions" },
      { label: "Technical deep dive", description: "Expand with implementation details and trade-offs" }
    ],
    multiSelect: false
  }]
})
```

4. **If option 2/3/4:** Run analysis, present results, ask whether to integrate
5. **Max 3 iterations per section**
6. Move to next section

**Section order:**
1. Vision
2. Goals
3. Target Users
4. Scope (In Scope + Out of Scope)
5. Constraints (Technical + Business + Regulatory)
6. Success Criteria

### Task 1A.4: Write Artifact

Write `docs/project-brief.md` with all approved sections.

---

## Section B: Brownfield - Codebase Analysis (Opus Subagent)

### Task 1B.1: Launch Opus Subagent

Use the `Task` tool with `subagent_type: Explore` to analyze the codebase:

```
Task({
  description: "Brownfield codebase analysis",
  subagent_type: "Explore",
  prompt: "Analyze this project thoroughly. For each category, provide specific details:

  1. **Tech Stack:** Languages, frameworks, runtime, database, ORM. Read package.json/requirements.txt/go.mod for exact versions.
  2. **Directory Structure:** Tree of main directories with a description of each one's role.
  3. **Architectural Patterns:** MVC, microservices, monolith, layered, etc. How are modules organized?
  4. **Entry Points & Routing:** Where does the app start? How are routes defined?
  5. **Database/ORM:** Schema files, migrations, data models.
  6. **Testing:** Test framework, patterns used, current coverage if detectable.
  7. **CI/CD:** Workflow files (GitHub Actions, GitLab CI, etc.)
  8. **Configuration:** Config files (.env.example, config files), environment variables.

  Format the output as structured markdown with clear sections."
})
```

### Task 1B.2: Write Codebase Analysis

Using the subagent output, write `docs/codebase-analysis.md` with sections:
- Stack
- Structure
- Patterns
- Entry Points & Routing
- Database
- Testing
- CI/CD
- Configuration

### Task 1B.3: Review with User

Present a summary of the codebase analysis and ask for confirmation:

```
AskUserQuestion({
  questions: [{
    question: "I've analyzed the codebase. Is the analysis correct? Is anything important missing?",
    header: "Review",
    options: [
      { label: "Confirm", description: "The analysis is correct and complete" },
      { label: "Corrections", description: "There are errors to fix" },
      { label: "Additions", description: "Important aspects are missing and need documenting" }
    ],
    multiSelect: false
  }]
})
```

If corrections/additions: update `docs/codebase-analysis.md`.

---

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 2, you MUST have completed ALL of these:

```
[ ] Read the project-brief.tmpl.md template
[ ] Gathered user input (did NOT invent content)
[ ] For EACH section (Vision, Goals, Target Users, Scope, Constraints):
  [ ] User approved or provided input
  [ ] No generic placeholders remain
  [ ] Section contains SPECIFIC data (not "the system shall...")
[ ] Vision contains at least 30 words (not a vague sentence)
[ ] Goals contain measurable metrics (not just "improve X")
[ ] Wrote docs/project-brief.md (or docs/codebase-analysis.md for brownfield)
[ ] Ran the gate script - PASSES
```

**If even ONE is unchecked -> DO NOT proceed.**

## Update State

```yaml
currentStep: 2
completedSteps:
  - step: 0
    completed: "{timestamp}"
  - step: 1
    completed: "{timestamp}"
    artifact: docs/project-brief.md  # or docs/codebase-analysis.md for brownfield
artifacts:
  projectBrief: docs/project-brief.md  # greenfield
  codebaseAnalysis: docs/codebase-analysis.md  # brownfield
```

## CONTEXT CHECK (Rule 12)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `startup-state.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compaction, RE-READ `startup-state.yaml` + current step and resume

## Gate: gate-discovery-complete

**Greenfield:**
```bash
# File exists
test -f docs/project-brief.md || exit 1

# Contains mandatory sections
grep -q "## Vision" docs/project-brief.md || exit 1
grep -q "## Goals" docs/project-brief.md || exit 1
grep -q "## Target Users" docs/project-brief.md || exit 1
grep -q "## Scope" docs/project-brief.md || exit 1

# Quality check: Vision at least 30 words (not a vague sentence)
VISION_START=$(grep -n "## Vision" docs/project-brief.md | head -1 | cut -d: -f1)
VISION_END=$(awk "NR>$VISION_START && /^## /{print NR; exit}" docs/project-brief.md)
VISION_END=${VISION_END:-$(wc -l < docs/project-brief.md)}
VISION_WORDS=$(sed -n "$((VISION_START+1)),$((VISION_END-1))p" docs/project-brief.md | wc -w)
[ "$VISION_WORDS" -ge 30 ] || { echo "WARN: Vision has only $VISION_WORDS words (minimum 30). Too vague?"; }

# Quality check: Goals have metrics
GOALS_WITH_METRIC=$(grep -c "Metric:" docs/project-brief.md || echo 0)
GOALS_COUNT=$(grep -c "\*\*Goal [0-9]" docs/project-brief.md || echo 0)
[ "$GOALS_WITH_METRIC" -ge "$GOALS_COUNT" ] || { echo "WARN: $GOALS_COUNT goals but only $GOALS_WITH_METRIC with Metric. Add metrics."; }

# No placeholder (specific pattern to avoid false positives with common words)
grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\{TODO\}|\{TBD\}" docs/project-brief.md && exit 1

echo "Gate passed"
```

**Brownfield:**
```bash
# File exists
test -f docs/codebase-analysis.md || exit 1

# Contains mandatory sections
grep -q "## Stack\|## Tech Stack" docs/codebase-analysis.md || exit 1
grep -q "## Structure\|## Struttura" docs/codebase-analysis.md || exit 1
grep -q "## Pattern" docs/codebase-analysis.md || exit 1
grep -q "## Database" docs/codebase-analysis.md || exit 1

# No placeholder (consistent with greenfield gate)
grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\{TODO\}|\{TBD\}" docs/codebase-analysis.md && exit 1

echo "Gate passed"
```

## FORBIDDEN ANTI-PATTERNS

- Do not write Vision with fewer than 30 words (too vague)
- Do not invent Goals without user input
- Do not use generic phrases like "the system shall improve the experience"
- Do not write Scope without a clear In/Out of Scope distinction
- Do not skip elicitation to "speed up" -- each section requires user approval

## Routing

After gate passed:
- Read and execute: `steps/step-02-prd.md`
