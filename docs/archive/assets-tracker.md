# Bismuth PKM Editor - Assets Tracker

**Last Updated**: 2026-05-25  
**Purpose**: Track all assets that need to be created and current placeholder status

---

## 🎨 Visual Assets

### Application Icons

| Asset           | Size/Format | Status         | Location                         | Priority | Notes                     |
| --------------- | ----------- | -------------- | -------------------------------- | -------- | ------------------------- |
| App Icon (PNG)  | 32x32px     | 🟡 Placeholder | `src-tauri/icons/32x32.png`      | P0       | Minimal 1x1 PNG currently |
| App Icon (PNG)  | 128x128px   | ❌ Missing     | `src-tauri/icons/128x128.png`    | P0       | Required for macOS        |
| App Icon (PNG)  | 128x128@2x  | ❌ Missing     | `src-tauri/icons/128x128@2x.png` | P0       | Retina display            |
| App Icon (PNG)  | 256x256px   | ❌ Missing     | `src-tauri/icons/256x256.png`    | P1       | macOS dock                |
| App Icon (PNG)  | 512x512px   | ❌ Missing     | `src-tauri/icons/512x512.png`    | P1       | macOS dock retina         |
| App Icon (ICNS) | Multi-size  | ❌ Missing     | `src-tauri/icons/icon.icns`      | P0       | macOS bundle              |
| App Icon (ICO)  | Multi-size  | ❌ Missing     | `src-tauri/icons/icon.ico`       | P0       | Windows bundle            |
| App Icon (PNG)  | 1024x1024px | ❌ Missing     | `src-tauri/icons/icon.png`       | P1       | Source/master icon        |

**Current Placeholder**: 1x1 transparent PNG created via Python script  
**Action Required**: Design proper Bismuth brand icon (see Design Specs below)

### UI Icons & Graphics

| Asset               | Type       | Status     | Location                     | Priority | Notes                |
| ------------------- | ---------- | ---------- | ---------------------------- | -------- | -------------------- |
| Splash Screen       | PNG/SVG    | ❌ Missing | `src/assets/splash.png`      | P2       | Optional for MVP     |
| Empty State Graphic | SVG        | ❌ Missing | `src/assets/empty-vault.svg` | P2       | No vault open        |
| Loading Spinner     | SVG/Lottie | ❌ Missing | `src/assets/loading.svg`     | P2       | Can use CSS spinner  |
| Error Illustration  | SVG        | ❌ Missing | `src/assets/error.svg`       | P3       | Generic error state  |
| Welcome Banner      | PNG/SVG    | ❌ Missing | `src/assets/welcome.png`     | P3       | First-run experience |

**Action Required**: Create SVG illustrations for empty states

### Demo Vault Assets

| Asset             | Type     | Status     | Location                         | Priority | Notes               |
| ----------------- | -------- | ---------- | -------------------------------- | -------- | ------------------- |
| Sample Notes      | Markdown | ❌ Missing | `demo-vault/`                    | P1       | For T008            |
| Sample Images     | PNG/JPG  | ❌ Missing | `demo-vault/attachments/`        | P2       | Embedded in notes   |
| Sample PDFs       | PDF      | ❌ Missing | `demo-vault/pdfs/`               | P2       | PDF annotation demo |
| Sample Graph Data | JSON     | ❌ Missing | `demo-vault/.bismuth/graph.json` | P2       | Pre-built graph     |

**Action Required**: Create demo vault structure (T008)

---

## 📝 Configuration Files

### Linting & Formatting

| File                 | Status     | Location            | Priority | Notes                               |
| -------------------- | ---------- | ------------------- | -------- | ----------------------------------- |
| `.eslintrc.cjs`      | ✅ Created | Root                | P0       | Configured for TS + Svelte          |
| `.prettierrc`        | ✅ Created | Root                | P0       | Configured with Svelte plugin       |
| `.eslintignore`      | ❌ Missing | Root                | P1       | Should ignore dist/, node_modules/  |
| `.prettierignore`    | ❌ Missing | Root                | P1       | Should ignore dist/, pnpm-lock.yaml |
| `rustfmt.toml`       | ❌ Missing | `src-tauri/`        | P0       | For T005                            |
| `.cargo/config.toml` | ❌ Missing | `src-tauri/.cargo/` | P1       | Rust compiler flags                 |

**Action Required**: Create missing ignore files and Rust formatting config (T004-T005)

### Testing Configuration

| File                         | Status     | Location      | Priority | Notes            |
| ---------------------------- | ---------- | ------------- | -------- | ---------------- |
| `vitest.config.ts`           | ❌ Missing | Root          | P0       | For T006         |
| `playwright.config.ts`       | ❌ Missing | Root          | P0       | For T007         |
| `tests/unit/example.test.ts` | ❌ Missing | `tests/unit/` | P0       | Sample unit test |
| `tests/e2e/smoke.spec.ts`    | ❌ Missing | `tests/e2e/`  | P0       | Sample E2E test  |

**Action Required**: Create test configurations and sample tests (T006-T007)

### Build & CI/CD

| File                            | Status     | Location             | Priority | Notes                |
| ------------------------------- | ---------- | -------------------- | -------- | -------------------- |
| `.github/workflows/ci.yml`      | ✅ Created | `.github/workflows/` | P0       | Already exists       |
| `.github/workflows/release.yml` | ✅ Created | `.github/workflows/` | P1       | Already exists       |
| `.dockerignore`                 | ❌ Missing | Root                 | P3       | If Docker needed     |
| `.npmignore`                    | ❌ Missing | Root                 | P3       | If publishing to npm |

**Action Required**: None for MVP

---

## 📚 Documentation Assets

### User Documentation

| Document              | Status     | Location | Priority | Notes                 |
| --------------------- | ---------- | -------- | -------- | --------------------- |
| README.md             | ❌ Missing | Root     | P0       | Project overview      |
| QUICKSTART.md         | ❌ Missing | `docs/`  | P1       | Getting started guide |
| USER_GUIDE.md         | ❌ Missing | `docs/`  | P2       | Feature documentation |
| KEYBOARD_SHORTCUTS.md | ❌ Missing | `docs/`  | P2       | Hotkey reference      |
| FAQ.md                | ❌ Missing | `docs/`  | P3       | Common questions      |

**Action Required**: Create README.md at minimum for MVP

### Developer Documentation

| Document        | Status     | Location | Priority | Notes                    |
| --------------- | ---------- | -------- | -------- | ------------------------ |
| CONTRIBUTING.md | ✅ Created | Root     | P1       | Already exists           |
| ARCHITECTURE.md | ❌ Missing | `docs/`  | P2       | System design doc        |
| API.md          | ❌ Missing | `docs/`  | P2       | Tauri commands reference |
| TESTING.md      | ❌ Missing | `docs/`  | P2       | Testing guidelines       |
| CHANGELOG.md    | ✅ Created | Root     | P0       | Already exists           |

**Action Required**: Create ARCHITECTURE.md and API.md

### Code Documentation

| Asset             | Status     | Location                | Priority | Notes                 |
| ----------------- | ---------- | ----------------------- | -------- | --------------------- |
| JSDoc comments    | ❌ Missing | `src/**/*.ts`           | P2       | Inline documentation  |
| Rust doc comments | ❌ Missing | `src-tauri/src/**/*.rs` | P2       | `///` style comments  |
| Component docs    | ❌ Missing | `src/**/*.svelte`       | P2       | Svelte component docs |

**Action Required**: Add during implementation

---

## 🎨 Design Specifications

### Brand Identity

**Status**: ❌ Not Defined

**Required Assets**:

- [ ] Logo design (SVG master)
- [ ] Color palette (primary, secondary, accent colors)
- [ ] Typography system (font families, sizes, weights)
- [ ] Icon style guide (line weight, corner radius, etc.)
- [ ] Brand guidelines document

**Bismuth Icon Concept Ideas**:

1. **Chemical Element**: Bi (Bismuth) periodic table symbol
2. **Crystal Structure**: Bismuth's distinctive stepped crystal pattern
3. **Knowledge Graph**: Interconnected nodes representing PKM
4. **Zettelkasten**: Card index box or linked cards
5. **Johnny.Decimal**: Folder hierarchy with decimal notation

**Recommended Approach**:

- Use simple, recognizable geometric shapes
- Ensure scalability from 16x16 to 1024x1024
- Work well in monochrome (for menu bar icons)
- Distinct silhouette for app switcher recognition

### Color Palette (Proposed)

**Status**: 🟡 Placeholder (using Obsidian-compatible CSS variables)

```css
/* Light Theme */
--background-primary: #ffffff;
--background-secondary: #f5f5f5;
--text-normal: #2e3338;
--text-muted: #888888;
--interactive-accent: #7c3aed; /* Purple - Bismuth-inspired */

/* Dark Theme */
--background-primary: #1e1e1e;
--background-secondary: #252525;
--text-normal: #dcddde;
--text-muted: #999999;
--interactive-accent: #a78bfa; /* Lighter purple for dark mode */
```

**Action Required**: Finalize brand colors and create CSS variable system

---

## 🗂️ Sample Content

### Demo Vault Structure (T008)

**Status**: ❌ Not Created  
**Priority**: P1 (Required for T008)

**Proposed Structure**:

```
demo-vault/
├── .bismuth/
│   ├── config.json           # Vault settings
│   ├── graph.json            # Pre-built graph data
│   └── tips/                 # Tip markdown files
│       ├── welcome.md
│       ├── wikilinks.md
│       └── johnny-decimal.md
├── 10-19 Life Admin/         # Johnny.Decimal Area
│   ├── 11 Personal/
│   │   ├── 11.01 About Me.md
│   │   └── 11.02 Goals 2026.md
│   └── 12 Projects/
│       └── 12.01 Bismuth Development.md
├── 20-29 Knowledge/          # Johnny.Decimal Area
│   ├── 21 Research/
│   │   ├── 21.01 Zettelkasten Method.md
│   │   └── 21.02 Johnny.Decimal System.md
│   └── 22 Notes/
│       ├── 22.01 PKM Best Practices.md
│       └── 22.02 Note-Taking Tips.md
├── attachments/              # Media files
│   ├── bismuth-logo.png
│   └── sample-diagram.png
├── templates/                # Note templates
│   ├── daily-note.md
│   └── project-note.md
└── README.md                 # Vault introduction
```

**Sample Note Content Needed**:

- [ ] Welcome note with wikilinks demo
- [ ] Zettelkasten methodology explanation
- [ ] Johnny.Decimal system guide
- [ ] Graph view demo (interconnected notes)
- [ ] Template examples
- [ ] Frontmatter examples (tags, dates, metadata)

**Action Required**: Create full demo vault (T008)

---

## 🔧 Placeholder Status Summary

### Currently Using Placeholders

| Asset          | Placeholder Type       | Replacement Needed       | Priority |
| -------------- | ---------------------- | ------------------------ | -------- |
| App Icon       | 1x1 transparent PNG    | Professional icon design | P0       |
| Color Scheme   | Obsidian CSS variables | Bismuth brand colors     | P1       |
| Loading States | CSS spinners           | Custom animations        | P2       |
| Empty States   | Text only              | SVG illustrations        | P2       |
| Demo Content   | None                   | Full demo vault          | P1       |

### No Placeholder (Blocking)

| Asset                | Blocks        | Priority | Action                      |
| -------------------- | ------------- | -------- | --------------------------- |
| rustfmt.toml         | T005          | P0       | Create immediately          |
| vitest.config.ts     | T006          | P0       | Create immediately          |
| playwright.config.ts | T007          | P0       | Create immediately          |
| Demo vault           | T008          | P1       | Create for Phase 1          |
| README.md            | Documentation | P0       | Create before first release |

---

## 📋 Action Items by Priority

### P0 - Critical (Blocks MVP)

- [ ] Create proper app icons (all sizes + ICNS + ICO)
- [ ] Create `rustfmt.toml` (T005)
- [ ] Create `vitest.config.ts` (T006)
- [ ] Create `playwright.config.ts` (T007)
- [ ] Create demo vault structure (T008)
- [ ] Create README.md

### P1 - High (Needed for Demo)

- [ ] Create `.eslintignore` and `.prettierignore`
- [ ] Create demo vault content (sample notes)
- [ ] Create QUICKSTART.md
- [ ] Finalize brand color palette
- [ ] Create ARCHITECTURE.md

### P2 - Medium (Polish)

- [ ] Create empty state SVG illustrations
- [ ] Create sample images for demo vault
- [ ] Create USER_GUIDE.md
- [ ] Add JSDoc comments to code
- [ ] Create API.md

### P3 - Low (Nice to Have)

- [ ] Create splash screen
- [ ] Create welcome banner
- [ ] Create FAQ.md
- [ ] Create error illustrations
- [ ] Docker configuration

---

## 🎯 Asset Creation Workflow

### For Icon Design

1. **Design Phase**:
   - Sketch concepts (5-10 variations)
   - Get feedback on direction
   - Refine chosen concept

2. **Production Phase**:
   - Create master SVG (1024x1024)
   - Export PNG sizes: 16, 32, 64, 128, 256, 512, 1024
   - Generate ICNS (macOS): `iconutil -c icns icon.iconset`
   - Generate ICO (Windows): Use ImageMagick or online tool

3. **Integration Phase**:
   - Replace placeholder in `src-tauri/icons/`
   - Update `tauri.conf.json` to re-enable bundle
   - Test on all platforms

### For Demo Vault

1. **Content Planning**:
   - Define user journey through demo
   - List key features to showcase
   - Write sample note outlines

2. **Content Creation**:
   - Write markdown notes
   - Add wikilinks between notes
   - Add frontmatter metadata
   - Create sample images

3. **Testing**:
   - Verify all wikilinks resolve
   - Test graph view rendering
   - Ensure Johnny.Decimal structure is valid

---

## 📊 Progress Tracking

**Overall Asset Completion**: 8/87 (9%)

| Category       | Complete | Total | Percentage |
| -------------- | -------- | ----- | ---------- |
| Visual Assets  | 1        | 17    | 6%         |
| Config Files   | 5        | 14    | 36%        |
| Documentation  | 2        | 15    | 13%        |
| Design Specs   | 0        | 5     | 0%         |
| Sample Content | 0        | 36    | 0%         |

**Last Updated**: 2026-05-25 23:00 UTC-04:00

---

## 🔗 Related Documents

- Implementation Status: `IMPLEMENTATION_STATUS.md`
- Feature Specification: `specs/feature/001-bismuth-pkm-editor/spec.md`
- Implementation Plan: `specs/feature/001-bismuth-pkm-editor/plan.md`
- Task Breakdown: `specs/feature/001-bismuth-pkm-editor/tasks.md`
