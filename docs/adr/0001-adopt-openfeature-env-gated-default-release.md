# ADR-0001: Adopt OpenFeature with Environment-Gated Default-Release Flags

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Bismuth maintainers

## Context

Bismuth needs safe feature rollout controls across environments without forcing per-flag boilerplate. The desired behavior is: if a flag is not explicitly configured, it should behave as released.

## Decision

Use OpenFeature in the web frontend with an environment-aware provider and default-release semantics.

- Runtime environment resolution order:
  1. `VITE_APP_ENV`
  2. `import.meta.env.MODE`
  3. `production` when `PROD`, otherwise `development`
- Flag config source: `VITE_FEATURE_FLAGS` JSON
- Missing flag key evaluates to `true` (released)

## Consequences

### Positive

- Controlled progressive rollout by environment
- Vendor-neutral feature-flag contract
- Safe default behavior for undefined flags

### Negative

- Additional configuration surface (`VITE_FEATURE_FLAGS`)
- Need to keep flag naming and documentation disciplined

### Neutral

- No immediate UX change unless flags are explicitly configured differently

## Alternatives Considered

1. Hardcoded booleans in app code — rejected due to poor rollout control
2. Ad-hoc env checks per feature — rejected due to duplication and inconsistency
3. External SaaS flag provider only — deferred; OpenFeature keeps provider choice open
