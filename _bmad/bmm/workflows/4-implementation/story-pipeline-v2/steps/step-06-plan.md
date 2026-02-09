# Step 6: Implementation Plan

## GOAL

Create implementation plan using /plan mode.

## CONTEXT LOADING

```yaml
load_lazy:
  - packages/backend/CONTEXT.md (if backend)
  - packages/frontend/CONTEXT.md (if frontend)
load: [story file, test files created in step 5]
```

## EXECUTION

### 1. Enter plan mode

```
Use EnterPlanMode tool
```

### 2. Explore codebase

> **RULE:** "Create files for backend" is NOT a valid task. Specify FULL paths and patterns to follow.
> **RULE:** Consult RESEARCH.md (from step 4) for existing patterns. Do NOT reinvent.

- Identify files to modify (FULL paths from root)
- Find existing patterns to follow (with file:line examples)
- Map dependencies (import/export chain)

### 3. Write plan

File: `.claude/plans/story-{story_id}.plan.md`

**Template with YAML frontmatter:**

```markdown
---
story_id: '{story_id}'
created: '{date}'
depends_on: []
files_modified:
  - path/file1.ts
  - path/file2.ts
must_pass: [typecheck, lint, test]
---

# Plan Story {story_id}

## Files to modify

| File            | Change      | Depends on |
| --------------- | ----------- | ---------- |
| path/to/file.ts | description | -          |

## Implementation order

1. Task X - depends on nothing
2. Task Y - depends on X

## Patterns to follow

- From RESEARCH.md: ...
- Use Result<T> for errors

## Risks

- ...
```

### 4. Request approval

```
Use ExitPlanMode tool
```

### 5. Plan gate

```bash
PLAN_FILE=".claude/plans/story-${STORY_ID}.plan.md"

# Plan exists
[ -f "$PLAN_FILE" ] || exit 1

# Has required sections
grep -q "## Files to modify" "$PLAN_FILE" || exit 1
grep -q "## Implementation order" "$PLAN_FILE" || exit 1

# At least 3 tasks listed in "Implementation order" section (not the whole file)
TASK_COUNT=$(sed -n '/## Implementation order/,/^## /p' "$PLAN_FILE" | grep -cE "^[0-9]+\." || echo 0)
[ "$TASK_COUNT" -ge 3 ] || exit 1

echo "GATE PASS: Plan approved"
```

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 7, you MUST have done ALL of these:

```
[ ] Used EnterPlanMode
[ ] Explored the codebase (files to modify identified)
[ ] Found existing patterns to follow (RESEARCH.md consulted)
[ ] Plan has at least 3 tasks in "Implementation order"
[ ] Each task maps to a specific file (not "various files")
[ ] Plan has "Files to modify" section with concrete paths
[ ] Plan has "Patterns to follow" section based on actual codebase
[ ] Plan approved by user (ExitPlanMode)
[ ] Ran plan gate - PASSES
```

**If even ONE of these is not done -> DO NOT proceed.**

## OUTPUT

```
Plan created: .claude/plans/story-{story_id}.plan.md
Files to modify: {count}
-> Step 7
```

## FORBIDDEN ANTI-PATTERNS

- Do not create a plan without exploring the codebase via EnterPlanMode
- Do not list generic files ("the controller") - use FULL paths from root
- Do not ignore RESEARCH.md from step 4 - it contains already-found patterns
- Do not create a plan with fewer than 3 tasks (too vague to be useful)
- Do not approve a plan without ExitPlanMode (user MUST approve)

## COMMON MISTAKES (Avoid these)

1. **Generic plan not anchored to codebase:** "Create files for backend" is NOT a valid task. "Create `packages/backend/src/routes/users.ts` following pattern from `packages/backend/src/routes/auth.ts`" is a valid task.
2. **Files to modify without full path:** Every file MUST have a path relative to project root. "the controller file" is NOT acceptable.
3. **Plan without consulting RESEARCH.md:** If RESEARCH.md exists (from step 4), you MUST reference found patterns in "Patterns to follow". Ignoring research leads to reinventing existing patterns.
4. **Implementation order without dependencies:** If Task B depends on Task A, it MUST be explicit. Order is not arbitrary.
5. **Plan too vague to follow:** Another developer (or Claude in a later session) must be able to follow the plan WITHOUT reading other context. If the plan requires "intuition", it's too vague.

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state to `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compacted. After compact, RE-READ state file + current step and resume
