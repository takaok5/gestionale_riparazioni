# Step 2: Story Brief (Opus Subagent)

## GOAL

Opus subagent explores codebase and creates story-brief.yaml

## CONTEXT LOADING

```yaml
load: [docs/epic-details.md section for this story (or docs/epics/epic-{n}-*.md if sharded)]
skip: [everything else]
```

## EXECUTION

### 1. Launch Opus subagent

```
Use Task tool with subagent_type: "general-purpose" and model: "opus"

Prompt for subagent:
"Explore the codebase for story {story_id}.

 STEP 1: READ docs/epic-details.md section Epic {epic_num} Story {story_num}
         (or docs/epics/epic-{epic_num}-*.md if sharded).
         EXTRACT: story title, all ACs with Given/When/Then.

 STEP 2: For EACH AC, SEARCH the codebase:
         - Files handling entities/models mentioned in Given
         - Files implementing actions similar to When
         - Test files verifying conditions similar to Then
         Use Grep and Glob to search entity names, routes, components.

 STEP 3: CREATE docs/sprint-artifacts/story-brief-{story_id}.yaml with:
         - target_modules: [FULL paths of files to modify, found in Step 2]
         - patterns_to_follow: [SPECIFIC patterns found in existing files, with file:line]
         - dependencies: [other modules that import/use target_modules]
         - risks: [CONCRETE technical risks based on what you found in the code]
         - existing_tests: [existing test files for target modules]

 RULES:
 - DO NOT invent paths - every path MUST exist in the codebase
 - If no relevant files found -> write 'no existing files found' (module is new)
 - patterns_to_follow MUST have at least 1 example with file:line"
```

### 2. Verify output

```bash
cat docs/sprint-artifacts/story-brief-${STORY_ID}.yaml
```

If file exists and has content -> Step 3
If missing -> Retry subagent

## OUTPUT

```
Story brief created: docs/sprint-artifacts/story-brief-{story_id}.yaml
-> Step 3
```

## FORBIDDEN ANTI-PATTERNS

- Do not invent target_modules with paths that don't exist in the codebase
- Do not write generic patterns_to_follow ("use MVC pattern") - cite specific file:line
- Do not skip searching for existing tests for target modules
- Do not leave risks empty - every change has at least 1 risk (breaking changes, performance, etc.)

## CONTEXT CHECK (Rule 6)

If session context exceeds 50%:
1. **DO NOT interrupt** - save state to `docs/sprint-artifacts/pipeline-state-{story_id}.yaml`
2. Write HANDOFF with: current step, completed steps, next action
3. Conversation will be auto-compressed. After compact, RE-READ state file + current step and resume
