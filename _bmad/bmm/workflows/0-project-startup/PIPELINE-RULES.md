# PIPELINE RULES - PROJECT STARTUP - READ ALWAYS

## RULE 1: NO OPTIONAL STEPS

Every step has MANDATORY tasks. Do not skip any.
Step 4 (Frontend Spec) is the ONLY exception: skippable if backend-only.
If you think about skipping a task -> YOU ARE DOING IT WRONG.

## RULE 2: LAZY CONTEXT

DO NOT load files not needed for the current step.
Check `workflow.yaml` section `context_loading.per_step` for what to load.

| Step | Files to Load |
|------|---------------|
| 0 | PIPELINE-RULES.md, workflow.yaml |
| 1 | templates/project-brief.tmpl.md (GF) / no template (BF) |
| 2 | docs/project-brief.md (GF) or docs/codebase-analysis.md (BF) + templates/prd.tmpl.md |
| 3 | docs/prd.md + templates/architecture.tmpl.md + data/tech-preferences.md + docs/codebase-analysis.md (BF) |
| 4 | docs/prd.md + docs/architecture.md + templates/frontend-spec.tmpl.md |
| 5 | docs/prd.md + docs/architecture.md + templates/epic-details.tmpl.md |
| 6 | ALL artifacts (only full-context step) |
| 7 | docs/architecture.md + templates/scaffold.tmpl.yaml + templates/claude-md.tmpl.md + all artifacts |

## RULE 3: PERSISTENT STATE

After EVERY completed step:

1. Update `startup-state.yaml` (currentStep, completedSteps, artifacts)
2. Verify gate before proceeding

## RULE 4: GATE BEFORE PROCEEDING

Every step ends with a verifiable gate. If the gate fails:

1. **ABSOLUTE STOP**
2. Do not proceed to next step
3. Fix the issue
4. Retry gate

## RULE 5: MANDATORY ELICITATION

Every section of every artifact MUST go through the elicitation menu:

1. Claude generates proposal
2. Present to user with options (Approve / Brainstorm / Competitor / Deep dive)
3. Iterate until approval
4. **Max 3 iterations per section** - then force-proceed with warning

## RULE 6: NO PLACEHOLDERS

FORBIDDEN: TODO, TBD, PLACEHOLDER, or empty sections in final artifacts.
If a gate finds a placeholder -> BLOCK until resolved.

## RULE 7: 100% COVERAGE

Every Functional Requirement (FR) in PRD MUST map to at least 1 story.
Step 6 (Validation) checks this. If coverage < 100% -> BLOCK.

## RULE 8: BDD FORMAT

ALL Acceptance Criteria MUST be in Given/When/Then format.
Free-form AC are not acceptable.

## RULE 9: STORY-PIPELINE COMPATIBILITY

Output MUST be consumable by `/story-pipeline`. The `epic-details.md` format MUST follow:
```
# Epic N: [Name]
## Story N.M: [Title]
**As a** [role], **I want** [action], **so that** [benefit]
### Acceptance Criteria
- **AC-1:** Given [context] When [action] Then [result]
### Complexity: [S/M/L/XL]
### Dependencies: [none | story refs]
```

## RULE 10: OPERATIONAL CONTEXT MAINTENANCE

Context files (`CLAUDE.md` root + shards, `config.yaml`) MUST be consistent and up-to-date:

1. **CLAUDE.md root** - created/updated in Step 7b with stack, commands, structure, conventions
2. **CLAUDE.md shards** - created in Step 7b for each main directory
3. **config.yaml** - created in Step 7d with correct paths to all artifacts

If an artifact is moved/renamed during the pipeline, update references IMMEDIATELY.
If `config.yaml` points to a non-existent file -> **BLOCK**.

## RULE 11: RESUME CAPABILITY

If session interrupted, resume from last completed step.
File `startup-state.yaml` contains `currentStep` and `completedSteps`.

## RULE 12: CONTEXT > 50%

If session context exceeds 50%:

1. STOP
2. Save full state to `startup-state.yaml`
3. Inform user and suggest session restart
4. On restart: load ONLY PIPELINE-RULES.md + startup-state.yaml + current step

## RULE 13: ZERO LIES

If a gate fails, DO NOT proceed. Do not declare "completed" if it's not.
Do not pretend an artifact is complete if it has gaps.
