# Bismuth Specifications

This directory contains all feature specifications, plans, and design artifacts for the Bismuth project.

## Directory Structure

```
specs/
├── README.md                    # This file
└── NNN-feature-name/            # Feature-specific directory (flat structure)
    ├── spec.md                  # Feature specification
    ├── plan.md                  # Implementation plan
    ├── tasks.md                 # Task breakdown
    ├── analysis.md              # Technical analysis (optional)
    ├── research.md              # Research notes (optional)
    ├── knowledge-frameworks.md  # Framework documentation (optional)
    └── checklists/              # Quality checklists
        └── requirements.md      # Requirements checklist
```

## Naming Conventions

### Feature Directories

**Format**: `NNN-feature-name`

- **NNN**: 3-digit sequential number (001, 002, 003, etc.)
- **feature-name**: kebab-case description (lowercase, hyphen-separated)

**Examples**:
- `001-bismuth-pkm-editor`
- `002-user-authentication`
- `003-graph-visualization`

### Files

All files use **kebab-case** naming:

- ✅ `spec.md`, `plan.md`, `tasks.md`
- ✅ `analysis.md`, `research.md`
- ✅ `knowledge-frameworks.md`
- ❌ ~~`ANALYSIS.md`~~, ~~`SPEC.md`~~

## File Descriptions

### Core Files

**`spec.md`** (Required)
- Feature specification
- User stories and requirements
- Success criteria
- Technology-agnostic

**`plan.md`** (Required)
- Technical implementation plan
- Architecture decisions
- Component breakdown
- Timeline and milestones

**`tasks.md`** (Required)
- Detailed task breakdown
- Dependencies and ordering
- Assignees and estimates
- Progress tracking

### Optional Files

**`analysis.md`**
- Cross-artifact consistency analysis
- Quality assessment
- Gap identification

**`research.md`**
- Background research
- Competitive analysis
- Technical exploration

**`knowledge-frameworks.md`**
- Relevant frameworks and methodologies
- Integration strategies
- Best practices

### Checklists

**`checklists/requirements.md`**
- Specification quality validation
- Completeness checks
- Readiness criteria

## Workflow Integration

### Spec Kit Commands

The flat structure works seamlessly with Spec Kit workflows:

```bash
# Create new feature spec
/speckit.specify <feature-description>

# Generate implementation plan
/speckit.plan

# Create task breakdown
/speckit.tasks

# Analyze consistency
/speckit.analyze
```

### Feature Directory Resolution

Feature directories are automatically resolved via `.specify/feature.json`:

```json
{
  "feature_directory": "specs/001-bismuth-pkm-editor"
}
```

This allows all Spec Kit commands to locate the current feature without hardcoded paths.

## Git Branch Naming

Feature branches follow the same numbering:

```bash
# Branch name matches spec directory
001-bismuth-pkm-editor
002-user-authentication
003-graph-visualization
```

## Migration from Old Structure

**Old structure** (nested):
```
specs/
└── feature/
    └── 001-bismuth-pkm-editor/
        ├── spec.md
        └── ...
```

**New structure** (flat):
```
specs/
└── 001-bismuth-pkm-editor/
    ├── spec.md
    └── ...
```

**Benefits**:
- Simpler navigation
- Cleaner paths
- Easier to browse
- Consistent with naming conventions

## Best Practices

### 1. One Feature Per Directory

Each feature gets its own numbered directory. Never mix features.

### 2. Keep Numbers Sequential

Use the next available number when creating a new feature:
- Check existing directories
- Use `NNN + 1` for new features
- Don't skip numbers

### 3. Use Descriptive Names

Feature names should be:
- Clear and concise (2-4 words)
- Action-oriented when possible
- Lowercase with hyphens

### 4. Maintain File Consistency

All files in a feature directory should:
- Use kebab-case naming
- Follow the standard structure
- Be properly linked in spec.md

### 5. Update feature.json

Always ensure `.specify/feature.json` points to the correct directory when switching features.

## Examples

### Good Feature Names

- `001-bismuth-pkm-editor` ✅
- `002-user-authentication` ✅
- `003-graph-visualization` ✅
- `004-pdf-annotation` ✅
- `005-web-clipper` ✅

### Bad Feature Names

- `001-Feature` ❌ (not descriptive)
- `002_user_auth` ❌ (underscore instead of hyphen)
- `003-UserAuthentication` ❌ (not kebab-case)
- `feature-004` ❌ (number at end)

## Related Documentation

- **[Naming Conventions](../docs/standards/naming-conventions.md)** - Project-wide naming standards
- **[Git Workflow](../docs/processes/GIT_WORKFLOW.md)** - Branching and commit strategy
- **[Spec Kit Guide](../.specify/README.md)** - Spec Kit workflow documentation

---

**Last Updated**: 2026-05-26  
**Maintainer**: Yeabsira Moges
