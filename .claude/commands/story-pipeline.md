---
description: 'Story pipeline v2 with blocking gates and anti-lie enforcement'
---

# Story Pipeline v2

Fraud-proof pipeline with blocking gates and lazy context loading.

## Parameters

- `$ARGUMENTS` = Story ID (e.g. "7.10")

## FIRST - READ THE RULES

```
MANDATORY: Read _bmad/bmm/workflows/4-implementation/story-pipeline-v2/PIPELINE-RULES.md
```

**KEY RULES:**

1. NO TASK IS OPTIONAL - do ALL tasks in every step
2. MINIMAL CONTEXT - load only files needed for current step
3. PERSISTENT STATE - save state after every task
4. MANDATORY GATE AT STEP END - verify gate and/or checklist before proceeding
5. CONTEXT MAINTENANCE - CLAUDE.md + config.yaml updated after every story (step 8 checks, step 9 validates)
6. IF CONTEXT BLOATS - save state and ask for session restart

## Execution

### 1. Load workflow

```
Read: _bmad/bmm/workflows/4-implementation/story-pipeline-v2/workflow.yaml
```

### 2. Run step 1

```
Read and execute: _bmad/bmm/workflows/4-implementation/story-pipeline-v2/steps/step-01-init.md
```

Step 1 determines routing to subsequent steps.

### 3. At EVERY step

1. Read ONLY the current step file
2. Execute ALL tasks (do not skip any!)
3. Complete the MANDATORY CHECKLIST
4. Save state to pipeline-state-{story_id}.yaml
5. Only then proceed to next step

## Pipeline Steps

| Step | Name               | Gate        |
| ---- | ------------------ | ----------- |
| 1    | Init + Worktree    | -           |
| 2    | Story Brief (Opus) | -           |
| 3    | Create Story       | structure   |
| 4    | Validate Story     | quality     |
| 5    | ATDD (RED)         | tests fail  |
| 6    | Plan               | plan exists |
| 7    | Implement (GREEN)  | tests pass  |
| 8    | Review             | 3+ issues   |
| 9    | Commit             | pre-merge   |
| 10   | Merge              | merged      |

## Gate = Exit Code

Every gate is an inline bash script. If exit != 0:

- **ABSOLUTE STOP**
- Do not proceed
- Fix the issue
- Retry gate

Claude CANNOT lie about exit codes.

## Context Loading

```yaml
always: [CLAUDE.md, config.yaml]
lazy:
  backend: packages/backend/CONTEXT.md
  frontend: packages/frontend/CONTEXT.md
  shared: packages/shared/CONTEXT.md
```

Load CONTEXT.md ONLY when needed for current step.

## Blocked Anti-Patterns

- Fake tests (gate checks expect() count)
- TODO in code (gate grep)
- Tests passing in RED phase (gate exit check)
- Tests failing in GREEN phase (gate npm test)
- Review without issues (gate count >= 3)
- Merge with conflicts (gate rebase check)
