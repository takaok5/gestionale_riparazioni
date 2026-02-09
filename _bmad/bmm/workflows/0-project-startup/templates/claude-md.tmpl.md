<!-- ANTI-HALLUCINATION: Every section MUST have an explicit source.
     Valid sources: user input, previous artifact, codebase scan.
     If source = "Claude hypothesis" -> ASK before writing. -->

# {project_name}

## Stack
{FROM_ARTIFACT: docs/architecture.md Tech Stack section:}
- Frontend: {FROM_ARTIFACT: docs/architecture.md -> framework + bundler + styling}
- Backend: {FROM_ARTIFACT: docs/architecture.md -> framework + runtime}
- Database: {FROM_ARTIFACT: docs/architecture.md -> database + ORM}
- Test: {FROM_ARTIFACT: docs/architecture.md -> test framework}

## Commands
{FROM_ARTIFACT: package.json scripts OR scaffold config:}
- `{FROM_ARTIFACT: package.json -> dev script}` - start dev server
- `{FROM_ARTIFACT: package.json -> build script}` - production build
- `{FROM_ARTIFACT: package.json -> test script}` - run tests
- `{FROM_ARTIFACT: package.json -> typecheck script}` - type checking
- `{FROM_ARTIFACT: package.json -> lint script}` - linting

## Structure
{FROM_ARTIFACT: docs/architecture.md Project Structure section:}
- `{FROM_ARTIFACT: docs/architecture.md -> dir1}/` - {FROM_ARTIFACT: description}
- `{FROM_ARTIFACT: docs/architecture.md -> dir2}/` - {FROM_ARTIFACT: description}
- `docs/` - project documentation
- `docs/epics/` - sharded epics

## Conventions
{FROM_ARTIFACT: docs/architecture.md Coding Standards section:}
- {FROM_ARTIFACT: docs/architecture.md -> convention 1}
- {FROM_ARTIFACT: docs/architecture.md -> convention 2}
- {FROM_ARTIFACT: docs/architecture.md -> convention 3}

## Anti-Patterns
- {FROM_ARTIFACT: docs/architecture.md Forbidden Anti-Patterns section -> anti-pattern 1}
- {FROM_ARTIFACT: docs/architecture.md Forbidden Anti-Patterns section -> anti-pattern 2}

---

### Shard Template (subdirectory CLAUDE.md)

```markdown
# {directory_name}

## Role
{Description of this directory's role in the project}

## Patterns
{Specific patterns used in this directory:}
- {pattern 1}
- {pattern 2}

## Key Files
{Key files to know:}
- `{file1}` - {role}
- `{file2}` - {role}

## Anti-Patterns
{What NOT to do in this directory:}
- {anti-pattern 1}

_See root CLAUDE.md for global rules_
```
