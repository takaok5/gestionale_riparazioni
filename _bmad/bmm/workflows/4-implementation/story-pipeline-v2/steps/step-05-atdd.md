# Step 5: ATDD Test Generation (RED Phase)

## GOAL

Write tests that FAIL. If they pass = error.

## CONTEXT LOADING

```yaml
load_lazy:
  - packages/backend/CONTEXT.md # Only if AC touches backend
  - packages/frontend/CONTEXT.md # Only if AC touches frontend
```

Read CONTEXT.md ONLY for directories you will modify.

## STOP_AND_VERIFY (Before writing tests)

Before writing any test:
1. **LIST** all ACs read from the story file (copy exact Given/When/Then)
2. For each test you will write: "Tests AC-{n}: {exact Given/When/Then}"
3. **If an AC is ambiguous** (e.g. "valid data", "correct response") → AskUserQuestion FIRST
4. DO NOT write tests for behaviors NOT present in the ACs
5. DO NOT write tests with generic expects - each expect must map to a specific Then
6. DO NOT use mocks that bypass the logic under test

## EXECUTION

### 1. Read ACs from the story

```bash
STORY_FILE=$(ls docs/stories/*.story.md | grep "$STORY_ID")
grep -A20 "^### AC" "$STORY_FILE"
```

### 2. For each AC, write test file

> **RULE:** `expect(true).toBe(true)` and `expect(result).toBeDefined()` are NOT valid tests. Test SPECIFIC values.
> **RULE:** If you mock everything, you're testing the mocks. Mock ONLY external dependencies.

Pattern: `packages/{backend|frontend}/src/**/__tests__/*.spec.ts`

Each test MUST:

- Have `describe()` with AC name
- Have at least 2 `it()` per AC
- Have real `expect()` (no placeholders)
- FAIL when executed (RED phase)

### 3. Verify written tests and SAVE LIST

```bash
# Find new tests (created in this session)
NEW_TESTS=$(git diff --name-only --diff-filter=A | grep -E "\.spec\.ts$")
echo "Tests created: $NEW_TESTS"

# SAVE test list for step 7 (GREEN phase)
echo "$NEW_TESTS" > docs/sprint-artifacts/atdd-tests-${STORY_ID}.txt
echo "Test list saved to: docs/sprint-artifacts/atdd-tests-${STORY_ID}.txt"

# Count expect()
EXPECT_COUNT=$(grep -r "expect(" $NEW_TESTS | wc -l)
echo "Assertions: $EXPECT_COUNT"
```

---

## BLOCKING GATE (MANDATORY)

```bash
#!/bin/bash
set -e

echo "=== GATE: ATDD RED PHASE ==="

# 1. Test files exist
NEW_TESTS=$(git diff --name-only --diff-filter=A | grep -E "\.spec\.ts$" || true)
if [ -z "$NEW_TESTS" ]; then
  echo "GATE FAIL: No test files created"
  exit 1
fi
echo "✓ Test files: $(echo "$NEW_TESTS" | wc -l)"

# 2. At least 5 expect()
EXPECT_COUNT=$(grep -rh "expect(" $NEW_TESTS 2>/dev/null | wc -l)
if [ "$EXPECT_COUNT" -lt 5 ]; then
  echo "GATE FAIL: Only $EXPECT_COUNT expect(), minimum 5"
  exit 1
fi
echo "✓ Assertions: $EXPECT_COUNT"

# 3. Tests MUST fail
echo "Running tests..."
npm test -- --run 2>&1 | tee docs/sprint-artifacts/test-output-${STORY_ID}.txt
TEST_EXIT=${PIPESTATUS[0]}

if [ "$TEST_EXIT" -eq 0 ]; then
  echo "GATE FAIL: Tests PASS but should FAIL (RED phase)"
  echo "If they pass, either the implementation already exists or the tests are fake"
  exit 1
fi
echo "✓ Tests fail as expected (RED phase verified)"

# 4. No TODO/SKIP in tests
if grep -rE "(\bTODO\b|\bSKIP\b|\.skip\()" $NEW_TESTS; then
  echo "GATE FAIL: Tests contain TODO/SKIP"
  exit 1
fi
echo "✓ No TODO/SKIP in tests"

echo "=== GATE PASS: ATDD RED PHASE ==="
echo "Tests to make pass in GREEN phase:"
cat docs/sprint-artifacts/atdd-tests-${STORY_ID}.txt
```

**Execute this script.**

### If GATE FAIL:

1. Read the specific error
2. Go back and fix:
   - "No test files" → Write real tests with Write tool
   - "< 5 expect()" → Add more assertions
   - "Tests PASS" → Tests don't test anything new, rewrite them
   - "TODO/SKIP" → Remove skips and implement complete tests
3. **Re-run the GATE** after the fix

Tests saved in `atdd-tests-{story_id}.txt` MUST pass in Step 7.

---

## OUTPUT

If GATE PASS:

```
✓ Tests fail correctly (RED phase)
→ Proceed to Step 6 (Plan)
```

If GATE FAIL:

```
✗ STOP - Resolve the issue before proceeding
```

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 6, you MUST have done ALL of these:

```
□ I read ALL ACs from the story
□ For EACH AC:
  □ I created a test file in packages/**/\__tests__/*.spec.ts
  □ The test has describe() with AC name
  □ The test has at least 2 it()
  □ The test has at least 3 expect()
  □ The test has NO .skip() or .todo()
□ I ran npm test -- tests FAIL (RED)
□ I saved the test list in atdd-tests-{story_id}.txt
□ I ran the GATE script - PASSES
```

**If even ONE of these is not done → DO NOT proceed.**

## SAVE STATE

```bash
# Read started_at BEFORE overwriting the file (cat > truncates the file)
PREV_STARTED=$(grep started_at docs/sprint-artifacts/pipeline-state-${STORY_ID}.yaml 2>/dev/null | awk '{print $2}' || echo "")
PREV_STARTED=${PREV_STARTED:-$(date -Iseconds)}

cat > docs/sprint-artifacts/pipeline-state-${STORY_ID}.yaml << EOF
story_id: '${STORY_ID}'
status: 'in_progress'
currentStep: 5
completedSteps: [1,2,3,4,5]
lastTaskCompleted: 'atdd'
worktree: true
started_at: '${PREV_STARTED}'
timestamp: '$(date -Iseconds)'
EOF
```

## COMMON MISTAKES (Avoid these)

1. **Tests that test the mock, not the logic:** If you mock the database AND the service AND the controller, you're testing that the mocks work. Mock ONLY external dependencies (DB, third-party APIs), NOT the logic under test.
2. **expect(result).toBeDefined() as the only assertion:** This passes even if result is an empty object. Test SPECIFIC values: `expect(result.status).toBe(201)`, `expect(result.body.name).toBe('test')`.
3. **Tests that pass immediately (not RED):** If a test passes BEFORE implementation, either the implementation already exists or the test doesn't test anything new. In both cases, the test is WRONG for the RED phase.
4. **Generic describe/it ("should work correctly"):** The test name MUST describe the specific behavior: "should return 404 when user not found", "should hash password before saving".
5. **Tests without cleanup:** If the test creates data (DB, files, state), it MUST clean up in afterEach/afterAll. Tests that pollute state cause other tests to fail unpredictably.

## FORBIDDEN ANTI-PATTERNS

- ❌ Writing checklists instead of real tests
- ❌ Tests with `expect(true).toBe(true)`
- ❌ Tests with `.skip()` or `.todo()`
- ❌ Proceeding without running npm test
- ❌ Ignoring tests that pass (means impl exists)

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compact, RE-READ state file + current step and resume
