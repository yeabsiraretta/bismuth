# Security Constitution

**Version**: 1.0.0 | **Created**: 2026-06-08 | **Application Type**: Desktop (Tauri + Svelte)

---

## 1. Trust Boundaries

### Trusted

- Rust backend (Tauri core process) — full filesystem access within vault scope
- Frontend renderer (Svelte/WebView) — sandboxed, communicates via IPC only
- User-local vault data — Markdown/JSON files on the user's filesystem

### Untrusted

- User-provided Markdown content (potential XSS via rendered HTML)
- External URLs in notes (link previews, potential SSRF if network features added)
- Third-party dependencies (npm, crates.io)
- Plugin/extension code (if plugin system is added in future)
- Imported vault archives from external sources

### Boundary Rules

- The frontend MUST NOT have direct filesystem access — all file operations go through Tauri IPC commands
- Tauri commands MUST validate that requested paths fall within the active vault directory (path traversal prevention)
- The WebView MUST NOT be granted blanket Tauri permissions — use capability-based access (`capabilities/default.json`)
- No network requests MUST be made without explicit user action and visible indication

---

## 2. Authentication & Authorization Standards

### Current State (Local Desktop)

- No user authentication required — the app runs as the OS user
- No authorization model — all vault data is accessible to the app user
- OS-level file permissions are the only access control

### Future-Proofing (If Multi-User or Sync Added)

- Authentication MUST be handled at the Tauri backend level, never in the frontend
- Session tokens MUST NOT be stored in localStorage (use Tauri secure storage or OS keychain)
- Any cloud sync MUST use end-to-end encryption with keys derived from user credentials
- OAuth flows MUST use PKCE and MUST NOT expose client secrets in the frontend bundle

---

## 3. Data Isolation & Privacy Rules

### Vault Isolation

- Each vault MUST be treated as an isolated data domain
- Tauri commands MUST scope all file operations to the currently active vault path
- Path parameters from the frontend MUST be canonicalized and validated against the vault root (prevent `../` traversal)
- No vault data MUST be written outside the vault directory without explicit user consent

### Sensitive Content Handling

- Frontmatter fields marked as sensitive (future: encrypted notes) MUST NOT appear in search indexes or previews without decryption
- Vault paths MUST NOT be logged to external services or analytics
- Auto-save content MUST remain within the vault directory
- Clipboard operations involving vault content MUST NOT persist beyond the app session

### Data at Rest

- Vault files are stored as plaintext Markdown/JSON (user's responsibility to encrypt the volume)
- Application state (layout, preferences) stored in localStorage/app data — MUST NOT contain vault content
- Component library files (`.bismuth/components/`) MUST remain within the vault boundary

---

## 4. Secrets Management Policy

### Current Requirements

- No API keys or secrets are required for core functionality (fully offline)
- If future integrations require API keys (LLM, sync services):
  - Keys MUST be stored via Tauri's secure storage API or OS keychain
  - Keys MUST NOT be stored in localStorage, vault files, or app config
  - Keys MUST NOT be committed to source control
  - Environment variables MAY be used for development but MUST NOT be the production mechanism

### Development Secrets

- `.env` files MUST be listed in `.gitignore`
- Test fixtures MUST NOT contain real credentials
- CI secrets MUST use GitHub Actions encrypted secrets (not repository variables)

---

## 5. Secure-by-Design Patterns

### IPC Security

- All Tauri `invoke()` calls MUST go through typed service wrappers (`src/lib/services/`)
- Tauri commands MUST validate all input parameters before filesystem operations
- Path arguments MUST be resolved and checked against allowed directories
- Large payloads (file reads) MUST have size limits to prevent memory exhaustion

### Content Rendering

- User Markdown rendered to HTML MUST be sanitized before DOM insertion
- Wikilink targets MUST be validated against known vault paths (no arbitrary file access)
- Embedded images MUST use Tauri's asset protocol, not raw `file://` URLs
- CodeMirror extensions MUST NOT execute arbitrary code from document content
- Live preview MUST NOT render `<script>`, `<iframe>`, or event handler attributes

### Dependency Security

- `pnpm audit` MUST be run in CI and MUST block on critical/high vulnerabilities
- `cargo audit` MUST be run for Rust dependencies
- Dependabot MUST be enabled for automated security updates
- New dependencies MUST include a justification (Constitution I: bloat review)

### Build & Distribution

- Tauri updater (if enabled) MUST verify signatures before applying updates
- Release binaries MUST be built in CI (reproducible builds), not local machines
- CSP (Content Security Policy) MUST be set in Tauri config to restrict WebView capabilities

---

## 6. API & Integration Security

### Current State

- No external API calls — fully offline application
- No webhooks, no server endpoints

### Future Guidelines (If Network Features Added)

- All external requests MUST use HTTPS
- All external requests MUST have configurable timeouts (default: 10s)
- DNS rebinding protection MUST be considered for any localhost-bound services
- Rate limiting MUST be applied to any outbound API calls
- Users MUST be informed when data leaves the local machine (visible network indicator)
- Certificate pinning SHOULD be used for first-party backend services

---

## 7. Audit, Logging & Monitoring

### Application Logging

- Security-relevant events MUST be logged (vault open/close, file export, settings changes)
- Logs MUST NOT contain file content, vault paths beyond the vault name, or sensitive frontmatter
- Log rotation MUST prevent unbounded disk usage
- Debug logging MUST be disabled in release builds

### Error Handling

- Errors MUST NOT expose internal filesystem paths to the UI (display user-friendly messages)
- Stack traces MUST NOT be shown in production builds
- Rust panics MUST be caught at the command boundary (MUST NOT crash the app)

---

## 8. Compliance Mapping

### OWASP Desktop Application Security

| Category           | Bismuth Status | Notes                             |
| ------------------ | -------------- | --------------------------------- |
| Input Validation   | Enforced       | Path validation in Tauri commands |
| Authentication     | N/A            | Local-only app                    |
| Session Management | N/A            | No sessions                       |
| Access Control     | OS-level       | Vault scoped                      |
| Cryptography       | Future         | If encrypted notes added          |
| Error Handling     | Enforced       | No path leakage in UI             |
| Data Protection    | Partial        | Plaintext at rest, vault-scoped   |
| Communication      | N/A            | No network (yet)                  |

### Supply Chain

- Dependabot enabled: `.github/dependabot.yml`
- CodeQL analysis: `.github/workflows/codeql.yml`
- Lock files committed: `pnpm-lock.yaml`, `Cargo.lock`

---

## Enforcement

- `/speckit.security-review.branch` — Review security of current branch changes
- `/speckit.security-review.audit` — Full codebase security review
- `/speckit.security-review.staged` — Review staged changes only

This constitution is the source of truth for all security audits performed by AI agents.
