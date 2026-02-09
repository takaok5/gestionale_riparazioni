# Step 4: Validate Story + Research

## GOAL

Critical validation of the story + existing pattern research.

## RESEARCH (before validating)

```bash
# Search existing patterns in the codebase for this feature
grep -rn "story_keyword" packages/ --include="*.ts" | head -10

# Find similar files you can use as reference
find packages/ -name "*.ts" -exec grep -l "similar_pattern" {} \;
```

**Document in `docs/sprint-artifacts/story-{id}-RESEARCH.md`:**

```markdown
## Patterns Found

- File X uses pattern Y for a similar problem
- Avoid anti-pattern Z (seen in file W)

## Known Pitfalls

- Watch out for ...

## Stack/Libraries to Use

- Use library X for ...
```

---

## VALIDATION

Critical story validation. MUST find at least 3 issues.

## CONTEXT LOADING

```yaml
load: [story file only]
skip: [CONTEXT.md, code]
```

## EXECUTION

### 1. Read story

```bash
cat docs/stories/${EPIC_NUM}.${STORY_NUM}.*.story.md
```

### 2. Validate critically

For EACH AC in the story, run these checks IN ORDER:

1. **READ the Given:** Is it SPECIFIC? Contains concrete data (names, values, states)?
   - If it contains "valid", "appropriate", "correct" -> ISSUE: Given too vague
2. **READ the When:** Is it a SINGLE, CLEAR action?
   - If it contains "and" (two actions) -> ISSUE: When too complex, split it
3. **READ the Then:** Can you write an `expect()` to verify it?
   - If NO -> ISSUE: Then not testable
   - If it contains "correctly", "properly", "as expected" -> ISSUE: Then vague
4. **CHECK sad path:** Is there at least 1 AC for invalid input/error?
   - If NO -> ISSUE: missing sad path
5. **VERIFY task coverage:** Does each AC have at least 1 task implementing it?
   - If NO -> ISSUE: missing task for AC-N

**RULE: Find AT LEAST 3 issues. If you don't find them, you haven't looked hard enough.**

### 3. Document and fix

> **RULE:** Changing wording without increasing specificity is NOT a fix. A valid fix turns a vague AC into a testable one.

For each issue:

1. Describe the problem
2. Propose a fix
3. Apply fix to the story
4. Verify fix applied

### 4. Quality gate

```bash
STORY_FILE=$(ls docs/stories/${EPIC_NUM}.${STORY_NUM}.*.story.md | head -1)

# All ACs testable (have complete Given/When/Then)
for ac in $(grep -n "^### AC" "$STORY_FILE" | cut -d: -f1); do
  BLOCK=$(sed -n "${ac},$((ac+30))p" "$STORY_FILE")
  echo "$BLOCK" | grep -q "Given" || { echo "AC missing Given"; exit 1; }
  echo "$BLOCK" | grep -q "When" || { echo "AC missing When"; exit 1; }
  echo "$BLOCK" | grep -q "Then" || { echo "AC missing Then"; exit 1; }
done

# No TODO/TBD after fixes (word boundary to avoid false positives)
grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b|\bFIXME\b" "$STORY_FILE" && exit 1

echo "GATE PASS: Story validated"
```

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 5, you MUST have done ALL of these:

```
[] Read the complete story file
[] Found at least 3 REAL issues (not fabricated to meet the quota)
[] For EACH issue found:
  [] Described the specific problem
  [] Proposed a concrete fix
  [] Applied the fix to the story
  [] Verified the fix is correct
[] RESEARCH.md written with patterns found in the codebase
[] All ACs are testable (Given/When/Then with specific data)
[] Task breakdown covers all ACs
[] NO TODO, TBD, PLACEHOLDER remaining after fixes
[] Ran the quality gate - PASSES
```

**If even ONE of these is not done -> DO NOT proceed.**

## OUTPUT

```
Issues found: {count}
Issues resolved: {count}
-> Step 5
```

## FORBIDDEN ANTI-PATTERNS

- Do not declare "3 issues found" with fabricated issues just to meet the quota
- Do not make cosmetic fixes (wording) and pass them off as substantive fixes
- Do not skip RESEARCH - search patterns in the codebase BEFORE validating
- Do not approve ACs containing "appropriate", "valid", "correct" without specifying what they mean

## COMMON MISTAKES (Avoid these)

1. **Fabricated issues to meet the minimum 3:** Every issue MUST be a REAL problem. "Missing period at end of sentence" is NOT a valid issue. Valid issues: ambiguous AC, missing edge case, undeclared dependency, task not covering an AC.
2. **Structural-only validation ("has 3 ACs, ok"):** Validate the CONTENT: are ACs testable? Is data specific? Is Given complete?
3. **Cosmetic fixes passed off as substantive:** Changing wording without changing specificity is NOT a fix. A valid fix turns an AC from "Then it works" to "Then returns 201 with body {id, createdAt}".
4. **Skipped research:** The RESEARCH section is MANDATORY. Search patterns in the codebase BEFORE validating - you might find the story duplicates existing functionality.
5. **ACs approved without verifying Then:** Every Then must be translatable to a test `expect()`. If you can't mentally write the expect, the Then is too vague.

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state in `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. The conversation will be auto-compressed. After compaction, RE-READ state file + current step and resume
