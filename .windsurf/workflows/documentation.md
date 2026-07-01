---
description: Documentation file management rules
---

# Documentation Management Workflow

## Critical Rules

1. **NO markdown files in project root** - Always use `docs/` folder
2. **Minimize documentation** - Only create when absolutely necessary
3. **Update existing files** - Don't create new files if content fits in existing docs
4. **Consolidate** - Prefer fewer, comprehensive files over many small ones

## File Locations

### Documentation Files → `docs/`

- Design documentation: `docs/DESIGN_SYSTEM.md`, `docs/DESIGN_PRINCIPLES.md`
- Architecture docs: `docs/ARCHITECTURE.md`
- Refactoring summaries: `docs/REFACTORING.md`
- Any other .md files: `docs/`

### Exceptions (Root Level Only)

- `README.md` - Project overview (required)
- `CHANGELOG.md` - Version history (if needed)
- `LICENSE` - License file (if needed)

### Configuration Files (Root Level)

- `package.json`, `tsconfig.json`, `vite.config.ts`, etc.
- `.gitignore`, `.prettierrc`, etc.

## Before Creating New Documentation

1. **Check if existing file covers topic** - Update instead of creating
2. **Ask: Is this essential?** - Skip if not critical
3. **Consolidate** - Combine related topics into single file
4. **Use code comments** - For implementation details, use inline comments instead

## Existing Documentation Structure

```
docs/
├── DESIGN_SYSTEM.md       # Design system and components
├── DESIGN_PRINCIPLES.md   # Design philosophy and rules
└── REFACTORING.md         # Refactoring summaries (consolidated)
```

## When to Create Documentation

✅ **DO create** when:

- Critical architecture decisions
- Design system changes
- Major refactoring summaries (consolidated)
- User-facing feature documentation

❌ **DON'T create** for:

- Temporary notes or summaries
- Implementation details (use code comments)
- Obvious changes
- Repetitive information already documented

## Moving Existing Files

If markdown files exist in root, move them:

```bash
mv ROOT_FILE.md docs/
```

Update any references to the moved files.
