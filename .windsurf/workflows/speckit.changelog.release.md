---
description: "Generate release notes and bump version for a completed milestone"
---

# Changelog Release

Promote the current `[Unreleased]` changelog section to a versioned release, bump the app version, and update the About page.

## Steps

1. **Read CHANGELOG.md** and identify the `[Unreleased]` section.

2. **Determine version bump** based on changes:
   - **Major** (x.0.0): Breaking changes, architectural overhauls
   - **Minor** (0.x.0): New features, new specs implemented
   - **Patch** (0.0.x): Bug fixes, documentation, refinements

3. **Prompt user** to confirm version (suggest based on change analysis).

4. **Update CHANGELOG.md**: Replace `[Unreleased]` with `[vX.Y.Z] — YYYY-MM-DD`.

5. **Bump version** in both:
   - `package.json` → `"version": "X.Y.Z"`
   - `src-tauri/Cargo.toml` → `version = "X.Y.Z"`

6. **Update About page** (`src/lib/components/settings/SettingsAbout.svelte`):
   - Update `appVersion` default to new version
   - Update `buildDate` to today
   - Update `latestChanges` with a short blurb from the release

7. **Generate release summary** for commit message:
   ```
   release: vX.Y.Z — brief description of highlights
   ```

## Rules

- Version must follow semver (MAJOR.MINOR.PATCH)
- Both package.json and Cargo.toml must have identical versions
- About page must always reflect the latest released version
- Never skip the changelog — every release must have documented changes
