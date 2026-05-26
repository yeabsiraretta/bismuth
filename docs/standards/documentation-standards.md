# Documentation Standards

## File Naming Conventions

### Markdown Files

**Format**: `lowercase-with-hyphens.md`

**Rules**:
- All lowercase letters
- Words separated by hyphens (kebab-case)
- Descriptive, concise names
- No spaces, underscores, or special characters
- Extension: `.md`

**Examples**:
- ✅ `tailwind-integration.md`
- ✅ `graph-view-implementation.md`
- ✅ `design-system-quick-reference.md`
- ❌ `TAILWIND_INTEGRATION.md`
- ❌ `GraphViewImplementation.md`
- ❌ `design system.md`

### Directory Structure

```
docs/
├── README.md                          # Project overview
├── architecture/                      # System architecture docs
│   ├── bismuth-architecture-proposal.md
│   ├── modular-architecture.md
│   └── canvas-mcp-protocol.md
├── development/                       # Development guides
│   ├── feature-development-guide.md
│   ├── demo-checklist.md
│   └── development-scripts.md
├── implementation/                    # Implementation details
│   ├── graph-view-implementation.md
│   ├── backlinks-implementation.md
│   └── tailwind-integration.md
├── milestones/                        # Project milestones
│   ├── phase-1-complete.md
│   └── phase-2-complete.md
├── processes/                         # Workflows and processes
│   ├── git-workflow.md
│   └── versioning.md
├── standards/                         # Coding and doc standards
│   ├── documentation-standards.md
│   ├── naming-conventions.md
│   └── documentation-template.md
└── status/                           # Project status tracking
    ├── implementation-status.md
    └── assets-tracker.md
```

## Document Structure

### Header Format

```markdown
# Document Title (Title Case in Content)

Brief description of what this document covers.

## Overview

High-level summary...

## Sections

Use H2 for main sections, H3 for subsections.
```

### Required Sections

1. **Title** (H1) - One per document
2. **Overview** - Brief summary
3. **Main Content** - Organized with H2/H3 headers
4. **Examples** (if applicable) - Code samples, usage
5. **References** (if applicable) - Links to related docs

### Code Blocks

Always specify language for syntax highlighting:

```markdown
\`\`\`typescript
const example = "code";
\`\`\`

\`\`\`bash
npm install package
\`\`\`
```

### Links

**Internal Links** (relative):
```markdown
See [Architecture Proposal](./architecture/bismuth-architecture-proposal.md)
```

**External Links**:
```markdown
See [Tailwind Docs](https://tailwindcss.com/docs)
```

## Frontmatter (Optional)

For documents that need metadata:

```markdown
---
title: Document Title
date: 2024-05-26
author: Team Name
tags: [architecture, design, implementation]
status: draft | review | complete
---
```

## Writing Style

### Tone
- Clear and concise
- Technical but accessible
- Active voice preferred
- Present tense for current state
- Past tense for completed work

### Formatting
- **Bold** for emphasis
- `code` for inline code, commands, file names
- > Blockquotes for important notes
- Lists for steps or options
- Tables for comparisons

### Examples

**Good**:
```markdown
## Installation

Install dependencies:

\`\`\`bash
npm install tailwindcss postcss autoprefixer
\`\`\`

Create configuration:

\`\`\`bash
npx tailwindcss init -p
\`\`\`
```

**Bad**:
```markdown
## Installation

You need to install some stuff. Run npm install and then create a config file.
```

## Version Control

### Commit Messages for Docs

```
docs: add tailwind integration guide
docs: update architecture proposal
docs: fix typo in naming conventions
```

### Review Process

1. Create documentation
2. Self-review for clarity
3. Check links and code examples
4. Commit with descriptive message
5. Update related docs if needed

## Maintenance

### Regular Updates
- Review quarterly for accuracy
- Update examples when code changes
- Archive outdated documents
- Keep status docs current

### Deprecation
When deprecating a document:
1. Add `[DEPRECATED]` to title
2. Add deprecation notice at top
3. Link to replacement document
4. Move to `docs/archive/` after 6 months

## Templates

Use templates for consistency:

- `docs/standards/documentation-template.md` - General template
- `docs/standards/feature-template.md` - Feature documentation
- `docs/standards/api-template.md` - API documentation

## Automation

### Pre-commit Hooks

Validate documentation:
- Check file naming (lowercase-with-hyphens)
- Verify markdown syntax
- Check for broken links
- Ensure required sections present

### CI/CD

- Build documentation site
- Run link checker
- Generate table of contents
- Deploy to docs site

## Quick Reference

**Creating New Doc**:
1. Choose appropriate directory
2. Use lowercase-with-hyphens.md naming
3. Start with template
4. Include required sections
5. Add examples and code blocks
6. Link from related docs
7. Commit with `docs:` prefix

**Updating Existing Doc**:
1. Check current accuracy
2. Update content
3. Update date/version if using frontmatter
4. Test code examples
5. Commit changes

## Tools

**Recommended**:
- **Markdown linter**: markdownlint
- **Link checker**: markdown-link-check
- **Formatter**: prettier
- **Preview**: VS Code Markdown Preview

**VS Code Extensions**:
- Markdown All in One
- markdownlint
- Markdown Preview Enhanced

## Status

✅ **ACTIVE** - These standards apply to all documentation going forward.

All existing documentation has been migrated to lowercase naming convention.
