---
description: 'Generate a changelog entry from spec history showing requirement changes over time'
---

# Changelog Generate

Generate a comprehensive changelog entry from the git history of spec artifacts and implementation milestones.

## Steps

1. **Read current CHANGELOG.md** at project root. If it doesn't exist, create it with Keep-a-Changelog format header.

2. **Identify scope**: Check which specs have been generated or completed since the last changelog entry.

   ```bash
   git log --oneline --since="$(head -20 CHANGELOG.md | grep -m1 '##' | grep -oP '\d{4}-\d{2}-\d{2}')" -- specs/ .specify/
   ```

   If no date found, use `git log --oneline -- specs/` for full history.

3. **Categorize changes** by reading each spec's `spec.md`, `plan.md`, and `tasks.md`:
   - **Added**: New features, new specs created
   - **Changed**: Modified requirements, updated plans
   - **Fixed**: Bug fixes, architecture corrections
   - **Removed**: Deferred/removed features
   - **Security**: Security-related changes

4. **Generate entry** in Keep-a-Changelog format:

   ```markdown
   ## [Unreleased] — YYYY-MM-DD

   ### Added

   - Feature description (spec NNN)

   ### Changed

   - Change description (spec NNN)
   ```

5. **Prepend to CHANGELOG.md** below the header, above previous entries.

6. **Update About page**: Read `CHANGELOG.md` latest entry and update `src/lib/components/settings/SettingsAbout.svelte`:
   - Set the `latestChanges` prop with a short blurb from the latest entry
   - Ensure the version string matches

## Rules

- Never delete existing entries — only prepend new ones
- Use Keep-a-Changelog format (https://keepachangelog.com)
- Reference spec numbers in entries (e.g., "spec 012")
- Keep entries concise: one line per change
- Group by category (Added/Changed/Fixed/Removed/Security)
