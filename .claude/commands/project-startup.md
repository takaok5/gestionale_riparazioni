---
description: 'Pre-story pipeline to generate project artifacts (greenfield/brownfield)'
---

# Project Startup Pipeline

Complete pipeline to generate all artifacts needed before starting Story Pipeline v2.

## Parameters

- `$ARGUMENTS` = Mode: `greenfield` (new project) or `brownfield` (existing project)

## FIRST - READ THE RULES

```
MANDATORY: Read _bmad/bmm/workflows/0-project-startup/PIPELINE-RULES.md
```

**KEY RULES:**

1. NO OPTIONAL STEPS - do ALL tasks in every step (Step 4 only exception)
2. LAZY CONTEXT - load only files needed for current step
3. PERSISTENT STATE - save state after every step to startup-state.yaml
4. GATE BEFORE PROCEEDING - every step has verifiable gate, if it fails STOP
5. MANDATORY ELICITATION - every section goes through options menu
6. NO PLACEHOLDERS - no TODO/TBD in final artifacts
7. 100% COVERAGE - every FR mapped to at least 1 story
8. BDD FORMAT - all AC in Given/When/Then
9. STORY-PIPELINE COMPATIBILITY - output consumable by /story-pipeline
10. CONTEXT MAINTENANCE - CLAUDE.md + config.yaml always consistent and up-to-date
11. RESUME - if session interrupted, resume from last completed step
12. CONTEXT > 50% - checkpoint and restart
13. ZERO LIES - if gate fails, DO NOT proceed

## Execution

### 1. Load workflow

```
Read: _bmad/bmm/workflows/0-project-startup/workflow.yaml
```

### 2. Run Step 0

```
Read and execute: _bmad/bmm/workflows/0-project-startup/steps/step-00-init.md
```

Step 0 determines mode (greenfield/brownfield) and routing to subsequent steps.

### 3. At EVERY step

1. Read ONLY the current step file
2. Execute ALL tasks (do not skip any!)
3. For each artifact section: generate proposal -> elicitation -> iterate
4. Complete the step GATE
5. Save state to `startup-state.yaml`
6. Only then proceed to next step

## Pipeline Steps

| Step | Name | Gate | Artifact |
|------|------|------|----------|
| 0 | Init | state exists | startup-state.yaml |
| 1 | Discovery | brief/analysis complete | project-brief.md / codebase-analysis.md |
| 2 | PRD | 3+ FR, 2+ NFR, no TODO | prd.md |
| 3 | Architecture | tech stack, models, FR coverage | architecture.md |
| 4 | Frontend Spec | pages, components, state (or skip) | frontend-spec.md |
| 5 | Epic Details | BDD stories, 3+ AC per story | epic-details.md |
| 6 | Validation | 100% coverage, 0 critical issues | validation-report.md |
| 7 | Scaffold + Shard | CLAUDE.md, config, git | project structure |

## Elicitation

After every generated section, present options to user:

1. **Approve and proceed** - Section is complete
2. **Brainstorming** - Generate divergent alternatives
3. **Competitor analysis** - Compare with market solutions
4. **Technical deep dive** - Expand implementation details

Max 3 iterations per section, then force-proceed.

## Final Output

At pipeline completion, the project will have:
- Complete documentation (brief, PRD, architecture, frontend-spec, epic-details)
- Validation report with 100% coverage
- CLAUDE.md root + directory shards
- _bmad/bmm/config.yaml for story-pipeline
- Ready for `/story-pipeline 1.1`
