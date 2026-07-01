# Collaboration Architecture

**Status**: Architecture Stub | **Spec**: 009-deferred-features

## Overview

This document defines the planned architecture for real-time multi-user collaboration in Bismuth canvas documents. The design uses a CRDT-based approach compatible with Yjs operation semantics.

## CRDT Strategy

### Operation Types

All mutations to a canvas document are expressed as typed operations:

| Operation         | Semantics                                    | Conflict Resolution                                                 |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `insert_element`  | RGA-ordered insertion into element list      | Concurrent inserts get deterministic ordering via author ID + clock |
| `delete_element`  | Tombstone-based deletion                     | No conflict — concurrent deletes are idempotent                     |
| `update_property` | LWW (Last-Writer-Wins) register per property | Higher clock wins; ties broken by author ID                         |
| `move_element`    | Position update with parent tracking         | LWW on position; structural conflicts resolved by tree-flattening   |

### Clock Model

- Each peer maintains a local logical clock (Lamport-style)
- Vector clocks per session track causal ordering across all peers
- Operations are causally ordered before application

## Cursor Presence Protocol

### Data Model

Each connected peer broadcasts:

- Cursor position (canvas coordinates)
- Element selection set
- Assigned color (server-assigned, distinct per session)
- Heartbeat timestamp (for timeout/removal)

### Broadcast Cadence

- Cursor position: throttled to 30fps max
- Selection changes: immediate
- Heartbeat: every 5 seconds
- Disconnect timeout: 15 seconds without heartbeat

## Conflict Resolution

### Property Conflicts (LWW)

When two peers update the same property on the same element:

1. Compare operation clocks
2. Higher clock wins
3. Equal clocks: lexicographic comparison of author IDs

### Structural Conflicts (Tree)

When operations create cycles or invalid parent chains:

1. Detect cycle in parent resolution
2. Break cycle by reverting the later (by clock) move operation
3. Flatten to root if unresolvable

## Transport Layer Options

### WebSocket (Recommended for MVP)

- Centralized server relays operations
- Simple server-authoritative ordering
- Lower complexity, easier NAT traversal
- Single point of failure

### WebRTC (Future P2P Mode)

- Direct peer-to-peer connections
- No central server requirement after signaling
- Better latency for small groups
- Requires STUN/TURN for NAT traversal
- Signaling server still needed for session establishment

## Type Contracts

All types are defined in `src/lib/types/collaboration.ts` with the `@architecture-stub` JSDoc tag. These types form the contract that any future implementation must satisfy.
