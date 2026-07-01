# Windsurf Quick Start for Bismuth

All Claude tooling is now integrated into Windsurf! Here's what you get automatically:

## 🎯 What's Available

### Skills (Auto-Activate)
Just ask naturally - skills trigger automatically:

- **"Review this UI component"** → `ux-review` skill activates
- **"Review this code/PR"** → `code-review` skill activates  
- **"Create a button component"** → `component-gen` skill activates

### Constitution Constraints (Auto-Enforced)
- ✅ 300-line file limit (auto-checked)
- ✅ 90%+ test coverage required
- ✅ UX evaluation for all UI changes
- ✅ Consistent UX across all interfaces

### Coding Principles (Auto-Applied)
- Clarity over brevity
- DRY (Don't Repeat Yourself)
- Fail fast with clear errors
- Testability as priority
- Appropriate data structures

## 📚 Key Resources

All automatically loaded from `.claude/` folder:

```
.claude/
├── project-context.md     # Architecture, tech stack, standards
├── ux-evaluator.md        # 168 UX principles, smell detection
├── component-guide.md     # Component generation with UX
├── agent-rules.md         # Workflow rules, coding principles
└── skills/                # Reusable workflows
    ├── ux-review/         # UI evaluation
    ├── code-review/       # Deep code review
    └── component-gen/     # Component generation
```

## 🚀 Common Workflows

### Creating a UI Component
```
You: "Create a dropdown component for vault templates"
AI: → Activates component-gen skill
    → Applies UX principles (min 40px height, keyboard nav, etc.)
    → Generates component with accessibility
    → Stays under 300 lines
```

### Reviewing UI
```
You: "Review the WelcomeScreen component for UX issues"
AI: → Activates ux-review skill
    → Evaluates against 168 UX principles
    → Detects UX smells
    → Provides scored report (0-100)
    → Lists priority fixes
```

### Code Review
```
You: "Review this vault_service.rs refactoring"
AI: → Activates code-review skill
    → Identifies root cause
    → Evaluates fix quality
    → Checks for refactor opportunities
    → Provides evidence-based recommendation
```

## ⚡ Quick Commands

```bash
pnpm dev              # Start dev server
pnpm tauri dev        # Start Tauri app
pnpm check            # Run all checks (includes file size check)
pnpm check:file-sizes # Verify 300-line limit
pnpm test:ci          # Run tests with coverage
pnpm docs:list        # List docs with summaries
```

## 🎨 UX Guardrails (Auto-Applied)

When creating/modifying UI:
- ✅ Min 40x40px for interactive elements (44x44px for primary)
- ✅ Max 7 items in lists/menus (cognitive load)
- ✅ Immediate feedback on all actions
- ✅ Keyboard navigation for all features
- ✅ Focus indicators (2px outline)
- ✅ Contrast ≥4.5:1 for text

## 📝 Commit Messages

AI automatically formats commits as:
```
prefix: short description (max one sentence)
```

**Prefixes**: feat, fix, tweak, style, refactor, perf, test, docs, chore, ci, build, revert, hotfix, init, merge

## 🔍 Pre-Action Checks

AI automatically checks before:
- **Every task**: Reads agent-rules, project-context, Constitution
- **Code changes**: Verifies 300-line limit, tests exist, UX principles
- **Creating files**: Confirms doesn't exist, fits Constitution, under 300 lines
- **Documentation**: Checks if exists elsewhere, adds value, consolidates

## 💡 Tips

1. **Just ask naturally** - Skills auto-activate based on your request
2. **Reference Constitution** - Say "check Constitution" for core principles
3. **Request UX review** - Say "review UX" for any UI component
4. **Ask for code review** - Say "review this code" for deep analysis
5. **Check file sizes** - Run `pnpm check:file-sizes` before committing

## 🎯 Performance Targets

AI enforces these automatically:
- Input latency: <16ms
- Page load: <1s
- Search results: <200ms
- Auto-save debounce: 500ms

---

**Everything is automatic!** Just work normally in Windsurf - all Claude tooling is active and ready.
