# Architecture Decision Records (ADR)

This folder stores architecture decisions for Bismuth.

## File Naming

- `NNNN-short-kebab-title.md`
- `NNNN` uses zero-padded numeric IDs.

## Numeric Range

- Supported range: `0000` through `9999`
- `0000` is reserved for template/meta use.
- New ADRs should use the next free number.

If IDs exceed `9999`, create a continuation policy ADR and introduce an expanded sequence (for example, five-digit IDs) explicitly.

## Lifecycle States

- Proposed
- Accepted
- Superseded
- Deprecated

## Required Sections

1. Context
2. Decision
3. Consequences
4. Alternatives considered
