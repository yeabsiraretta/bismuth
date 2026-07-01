<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/006-service-bugfixes/plan.md

## Spec Kit Extensions Available

Use these slash commands for governed development workflows:

- `/speckit.specify` - Create/update feature spec
- `/speckit.plan` - Generate implementation plan
- `/speckit.tasks` - Generate dependency-ordered tasks
- `/speckit.implement` - Execute implementation from tasks.md
- `/speckit.clarify` - Clarify underspecified areas
- `/speckit.analyze` - Cross-artifact consistency check
- `/speckit.architecture-guard.architecture-review` - Review for architecture drift
- `/speckit.architecture-guard.governed-implement` - Implement with architecture review
- `/speckit.wireframe.generate` - Generate SVG wireframes from spec

### Spec Kit

You MUST follow the memory-first workflow defined in `.specify/memory/workflow.md` and proactively execute `/speckit.memory-md.plan-with-memory` before planning.

## Key Files

- Constitution: `.specify/memory/constitution.md`
- Workflow: `.specify/memory/workflow.md`
- Memory Index: `docs/memory/INDEX.md`
- Extension config: `.specify/extensions.yml`
- Integration guide: `docs/development/extension-integration.md`

<!-- SPECKIT END -->
