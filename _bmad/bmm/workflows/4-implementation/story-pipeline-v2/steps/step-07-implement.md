# Step 7: Implementation (GREEN Phase)

## GOAL

Implement code that makes ALL tests PASS.
**UPDATE THE STORY FILE** after each completed task.

## CONTEXT LOADING

```yaml
load_lazy:
  - packages/backend/CONTEXT.md
  - packages/frontend/CONTEXT.md
  - packages/shared/CONTEXT.md
```

Load CONTEXT.md for the directories you modify.

## EXECUTION

### 1. Load approved plan

```bash
PLAN_FILE=".claude/plans/story-${STORY_ID}.plan.md"
cat "$PLAN_FILE"
```

### 2. For each task in the plan

> **RULE:** Code with TODO/FIXME is NOT implemented. Functions with hardcoded values are NOT implemented.
> **RULE:** NEVER declare "completed" without running npm test.

**MANDATORY CYCLE for each task:**

1. **Implement** the code for the task
2. **Run tests** incrementally:
   ```bash
   npm test -- --run --testPathPattern="AC-{n}"
   ```
3. **If test passes:**

   - **UPDATE THE STORY FILE** - mark the task as `[x]`

   ```bash
   # Example: change "- [ ] Task 1.1" to "- [x] Task 1.1"
   sed -i 's/- \[ \] Task 1\.1/- [x] Task 1.1/' docs/stories/*.story.md
   ```

   - Make incremental commit:

   ```bash
   # Add specific files (DO NOT use git add -A to avoid .env, credentials)
   git add packages/ docs/stories/ && git commit -m "feat(${STORY_ID}): complete task 1.1"
   ```

   - Proceed to next task

4. **If test fails** - fix and retry (DO NOT mark [x]!)

### 3. Progressive verification

After every 2-3 tasks:

```bash
npm run typecheck
npm run lint -- --quiet
```

### STOP_AND_VERIFY (Before marking [x])

Before marking ANY task as `[x]`:
1. **VERIFY** the specific test for that task PASSES (show npm test output)
2. **VERIFY** the code matches the approved plan in `.claude/plans/story-{story_id}.plan.md`
3. **VERIFY** there are NO TODO/FIXME in the code just written
4. If the test does not pass - DO NOT mark [x], fix first
5. If you deviated from the plan - document the deviation in the story file

### 4. CRITICAL RULE

**NEVER mark a task [x] if:**

- The test does not pass
- The code has TODO/FIXME
- The implementation is partial
- You have not verified it works

**If a task is blocked:**

- Leave it `[ ]`
- Document the blocker in the story file
- Proceed with other tasks if possible

---

## BLOCKING GATE (MANDATORY)

```bash
#!/bin/bash
set -e

echo "=== GATE: GREEN PHASE ==="

# 1. TypeScript compiles
echo "TypeCheck..."
npm run typecheck || { echo "GATE FAIL: TypeScript errors"; exit 1; }
echo "✓ TypeCheck pass"

# 2. Lint passes
echo "Lint..."
npm run lint || { echo "GATE FAIL: Lint errors"; exit 1; }
echo "✓ Lint pass"

# 3. Build passes
echo "Build..."
npm run build || { echo "GATE FAIL: Build errors"; exit 1; }
echo "✓ Build pass"

# 4. ATDD tests (from step 5) MUST pass
echo "Running ATDD tests from RED phase..."
ATDD_TESTS_FILE="docs/sprint-artifacts/atdd-tests-${STORY_ID}.txt"
if [ ! -f "$ATDD_TESTS_FILE" ]; then
  echo "GATE FAIL: Missing atdd-tests-${STORY_ID}.txt - step 5 not completed?"
  exit 1
fi

# Run SPECIFICALLY the tests created in step 5
ATDD_TESTS=$(cat "$ATDD_TESTS_FILE" | tr '\n' ' ')
echo "ATDD tests to verify: $ATDD_TESTS"
npm test -- --run $ATDD_TESTS || { echo "GATE FAIL: ATDD tests still failing"; exit 1; }
echo "✓ ATDD tests pass (RED→GREEN verified)"

# 5. ALL tests pass (including existing ones)
echo "Running full test suite..."
npm test -- --run || { echo "GATE FAIL: Some tests failing"; exit 1; }
echo "✓ All tests pass (GREEN phase verified)"

# 6. No TODO in NEW code
echo "Checking for TODO..."
CHANGED_FILES=$(git diff --name-only HEAD~1 -- "*.ts" "*.tsx" 2>/dev/null || git diff --name-only --cached -- "*.ts" "*.tsx")
for f in $CHANGED_FILES; do
  if [ -f "$f" ]; then
    if grep -nE "\bTODO\b|\bFIXME\b|\bXXX\b|\bHACK\b" "$f"; then
      echo "GATE FAIL: $f contains TODO/FIXME"
      exit 1
    fi
  fi
done
echo "✓ No TODO in new code"

# 7. No console.log in modified files
for f in $CHANGED_FILES; do
  if [ -f "$f" ]; then
    if grep -n "console\.log" "$f" | grep -v "// keep"; then
      echo "GATE FAIL: $f contains console.log"
      exit 1
    fi
  fi
done
echo "✓ No console.log"

# 8. Correct imports/exports (no circular)
echo "Check circular imports..."
npx madge --circular packages/*/src 2>/dev/null || true
echo "✓ Import check done"

echo "=== GATE PASS: GREEN PHASE ==="
```

**Run this script.**

### If GATE FAIL:

1. Read the specific error
2. Go back and fix:
   - "TypeScript errors" - `npm run typecheck`, fix reported errors
   - "Lint errors" - `npm run lint --fix`, then manual fixes
   - "Build errors" - Fix import/export, dependencies
   - "ATDD tests failing" - Implement code to make tests pass
   - "Tests failing" - Debug and fix the code
   - "TODO in code" - Remove TODOs and implement
   - "console.log" - Remove or add `// keep` if needed
3. **Re-run the GATE** after fixing

---

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 8, you MUST have done ALL of these:

```
□ Read the plan from .claude/plans/story-{story_id}.plan.md
□ For EACH task in the plan:
  □ Implemented the code
  □ Ran npm test for that task
  □ Test PASSES
  □ Marked [x] in the story file
  □ Made incremental commit
□ Ran npm run typecheck - PASSES
□ Ran npm run lint - PASSES
□ Ran npm run build - PASSES
□ Ran the GATE script - PASSES
□ No TODO/FIXME in new code
□ No console.log in new code
```

**If even ONE of these is not done -> DO NOT proceed.**

## SAVE STATE

```bash
# Read started_at BEFORE overwriting the file (cat > truncates the file)
PREV_STARTED=$(grep started_at docs/sprint-artifacts/pipeline-state-${STORY_ID}.yaml 2>/dev/null | awk '{print $2}' || echo "")
PREV_STARTED=${PREV_STARTED:-$(date -Iseconds)}

# Update state file
cat > docs/sprint-artifacts/pipeline-state-${STORY_ID}.yaml << EOF
story_id: '${STORY_ID}'
status: 'in_progress'
currentStep: 7
completedSteps: [1,2,3,4,5,6,7]
lastTaskCompleted: 'implementation'
worktree: true
started_at: '${PREV_STARTED}'
timestamp: '$(date -Iseconds)'
EOF
```

## OUTPUT

If GATE PASS:

```
✓ All tests pass (GREEN)
✓ No TODO in code
✓ State saved
→ Proceed to Step 8 (Review)
```

If GATE FAIL:

```
✗ STOP - Fix before proceeding
```

## FORBIDDEN ANTI-PATTERNS

- No declaring "completed" without running gate
- No code with TODO passed off as implemented
- No skipping tests for "speed"
- No commits with failing tests
- No console.log left in code
- No partial implementation (only some ACs)

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compaction, RE-READ state file + current step and resume
