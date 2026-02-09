# Step 3: Create Story File (Opus Subagent)

## GOAL

Create story file with AC in BDD format and task breakdown.

## CONTEXT LOADING

```yaml
load:
  - story-brief-{story_id}.yaml
  - epic-details.md (story section only)
skip: [CONTEXT.md, other files]
```

## STOP_AND_VERIFY (Before creating story file)

Before launching the subagent:
1. **VERIFY** you read `story-brief-{story_id}.yaml` - list found fields
2. **VERIFY** you read `epic-details.md` specific story section - list found ACs
3. For each AC you will write: "Derived from epic-details AC-{n}" or "NO SOURCE -> ask"
4. **If story brief lacks sufficient context -> AskUserQuestion BEFORE creating**
5. DO NOT invent ACs not present in epic-details
6. DO NOT use generic data ("valid data", "appropriate response") - use SPECIFIC data from context

## EXECUTION

### 1. Launch Opus subagent

```
Use Task tool with subagent_type: "general-purpose" and model: "opus"

Prompt:
"Create docs/stories/{epic}.{story}.{title}.story.md
 Use story-brief and epic-details.

 MUST HAVE:
 - YAML frontmatter with status, priority, estimate
 - At least 3 ACs with Given/When/Then in EXPANDED format (each AC with **Given** / **When** / **Then** on separate lines, NOT inline)
 - Task breakdown covering all ACs
 - NO TODO, NO TBD, NO PLACEHOLDER

 ANTI-HALLUCINATION RULES:
 - Given MUST contain SPECIFIC data (field names, concrete values), NOT 'valid data' or 'correct input'
 - Then MUST be translatable into a test expect()
 - Each AC MUST derive from epic-details, NOT be invented
 - Task breakdown MUST reference SPECIFIC project files/modules"
```

### 2. Structure gate

```bash
STORY_FILE=$(ls docs/stories/${EPIC_NUM}.${STORY_NUM}.*.story.md | head -1)

# Frontmatter exists
grep -q "^status:" "$STORY_FILE" || exit 1

# At least 3 ACs
AC_COUNT=$(grep -c "^### AC" "$STORY_FILE")
[ "$AC_COUNT" -ge 3 ] || exit 1

# Given/When/Then per AC
GWT=$(grep -cE "^\*\*(Given|When|Then)\*\*" "$STORY_FILE")
[ "$GWT" -ge 9 ] || exit 1  # 3 per AC * 3 ACs

# No TODO (word boundary to avoid false positives)
grep -qE "\bTODO\b|\bTBD\b|\bPLACEHOLDER\b" "$STORY_FILE" && exit 1

echo "GATE PASS: Story structure OK"
```

## MANDATORY CHECKLIST (DO NOT SKIP)

Before proceeding to step 4, you MUST have completed ALL of these:

```
[] Read story-brief-{story_id}.yaml
[] Read epic-details.md specific story section
[] Story file has YAML frontmatter (status, priority, estimate)
[] Story file has at least 3 ACs in EXPANDED format (Given/When/Then on separate lines)
[] Each AC contains SPECIFIC data (not "valid data", "appropriate response")
[] Task breakdown covers ALL ACs
[] NO TODO, TBD, PLACEHOLDER present
[] Ran structure gate - PASSES
```

**If even ONE of these is not done -> DO NOT proceed.**

## OUTPUT

```
Story created: docs/stories/{story_file}
AC: {count}, Tasks: {count}
-> Step 4
```

## FORBIDDEN ANTI-PATTERNS

- Do not create story without reading story-brief and epic-details first
- Do not use inline AC format - MUST be expanded (Given/When/Then on separate lines)
- Do not write generic task breakdown ("implement feature") - each task must reference specific files
- Do not omit YAML frontmatter (status, priority, estimate are MANDATORY)

## COMMON MISTAKES (Avoid these)

1. **Generic story without project context:** Story MUST reference entities/models defined in architecture.md, NOT use generic names like "Item", "Entity", "Data".
2. **AC with "appropriate response" or "correct behavior":** Specify EXACTLY what happens - HTTP code, message, redirect, UI state.
3. **Task breakdown too high-level ("Implement backend"):** Each task must be completable in 1-2 hours and reference specific files.
4. **Missing or incomplete frontmatter:** status, priority, estimate are MANDATORY. If missing, pipeline-state cannot track the story.
5. **Inline AC instead of expanded:** In story-pipeline-v2, ACs MUST be in expanded format (Given/When/Then on separate lines with **bold**), NOT inline.

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state to `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. Conversation will be auto-compressed. After compaction, RE-READ state file + current step and resume
