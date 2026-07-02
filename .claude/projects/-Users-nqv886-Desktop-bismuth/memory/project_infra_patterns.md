---
name: Infrastructure improvement patterns from spec 052
description: Methodologies adopted from MKH design system for Bismuth infrastructure — slot contracts, token governance, contribution intake, typography map
type: project
---

Spec 052 introduces 8 infrastructure methodologies translated from MKH Marketer Hub into Bismuth's Svelte/Tauri stack:

1. **Named slot contracts** — co-located `*.slots.ts` files document zone responsibilities for layout shells; `SlotContract` type in `src/lib/types/layout/slotContract.ts`
2. **CSS token enforcement** — `stylelint.config.js` + `pnpm lint:css` script; blocks raw hex in color/background/border properties
3. **Feature barrel enforcement** — `eslint no-restricted-imports` rule blocks `@/features/*/stores/*`, `*/services/*`, `*/components/*` from cross-feature consumers
4. **Semantic typography map** — `src/lib/styles/typography.css` with `.bismuth-heading-xl/lg/md/sm`, `.bismuth-body`, `.bismuth-body-sm`, `.bismuth-body-code`, `.bismuth-caption` + overflow utilities
5. **Component contribution intake** — `CONTRIBUTING_COMPONENTS.md` with 9-field checklist, 1:1 vs 1:Many data pattern check, naming rules, PR template
6. **Vitest coverage thresholds** — baseline 80/70/80/80 (lines/branches/functions/statements); ramp to 90 over 3 sprints
7. **Settings as feature module** — `src/lib/features/settings/` with stores split by domain (editor/appearance/general), single IPC adapter (`settingsPersistence.ts`)
8. **Canvas stores domain split** — `elements/`, `library/`, `arrangement/`, `history/`, `presentation/` subfolders with `index.ts` barrel

**Why:** Roadmap specs 039–051 will add significant complexity; these gates prevent constitution drift before it accumulates.

**How to apply:** When any new feature touches settings, it imports from `@/features/settings`. When a layout shell is created, always add a co-located `.slots.ts`. When a component is extracted from a feature for shared use, run it through the 9-field contribution intake.
