import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (p: string) => p }));
vi.mock('@/hubs/core/stores/vault-store.svelte', () => ({
  getNotes: () => [],
  getVault: () => null,
  setVault: vi.fn(),
  setNotes: vi.fn(),
  setActiveNote: vi.fn(),
  initVaultStore: vi.fn(),
  rescanVault: vi.fn(),
  isStoreInitialized: () => true,
}));
vi.mock('@/hubs/editor/services/file-ops', () => ({
  getCachedContent: () => undefined,
  updateCachedContent: vi.fn(),
  clearFileCache: vi.fn(),
  hydrateVaultContent: vi.fn(),
  isContentHydrated: () => false,
}));
vi.mock('@/utils/log/logger', () => ({
  log: { child: () => ({ info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() }) },
}));

import { buildPortentObject } from '@/hubs/knowledge/services/portent-service';
import {
  ENTP_TYPES,
  getTypeGroup,
  getTypeMeta,
  isEntpType,
  isLifecycleState,
  isPortentType,
  isPortType,
  LIFECYCLE_STATES,
  PORT_TYPES,
  PORTENT_TYPES,
  TYPE_REGISTRY,
} from '@/hubs/knowledge/types/portent-types';

// ── Type guards ──────────────────────────────────────────────────────────────

describe('type guards', () => {
  it('isPortType identifies actionable types', () => {
    expect(isPortType('project')).toBe(true);
    expect(isPortType('operation')).toBe(true);
    expect(isPortType('responsibility')).toBe(true);
    expect(isPortType('task')).toBe(true);
    expect(isPortType('event')).toBe(false);
    expect(isPortType('note')).toBe(false);
    expect(isPortType('topic')).toBe(false);
    expect(isPortType('person')).toBe(false);
    expect(isPortType('unknown')).toBe(false);
  });

  it('isEntpType identifies non-actionable types', () => {
    expect(isEntpType('event')).toBe(true);
    expect(isEntpType('note')).toBe(true);
    expect(isEntpType('topic')).toBe(true);
    expect(isEntpType('person')).toBe(true);
    expect(isEntpType('project')).toBe(false);
    expect(isEntpType('task')).toBe(false);
  });

  it('isPortentType covers all 8 types', () => {
    for (const t of PORTENT_TYPES) {
      expect(isPortentType(t)).toBe(true);
    }
    expect(isPortentType('foobar')).toBe(false);
  });

  it('isLifecycleState validates states', () => {
    expect(isLifecycleState('captured')).toBe(true);
    expect(isLifecycleState('organized')).toBe(true);
    expect(isLifecycleState('archived')).toBe(true);
    expect(isLifecycleState('deleted')).toBe(false);
  });
});

// ── Constants ────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('PORT_TYPES has 4 members', () => {
    expect(PORT_TYPES).toHaveLength(4);
  });

  it('ENTP_TYPES has 4 members', () => {
    expect(ENTP_TYPES).toHaveLength(4);
  });

  it('PORTENT_TYPES has 8 members', () => {
    expect(PORTENT_TYPES).toHaveLength(8);
  });

  it('LIFECYCLE_STATES has 3 members', () => {
    expect(LIFECYCLE_STATES).toHaveLength(3);
  });
});

// ── TYPE_REGISTRY ────────────────────────────────────────────────────────────

describe('TYPE_REGISTRY', () => {
  it('has 8 entries matching all types', () => {
    expect(TYPE_REGISTRY).toHaveLength(8);
    const ids = TYPE_REGISTRY.map((t) => t.id);
    for (const t of PORTENT_TYPES) {
      expect(ids).toContain(t);
    }
  });

  it('PORT types are actionable', () => {
    for (const meta of TYPE_REGISTRY.filter((t) => t.group === 'PORT')) {
      expect(meta.actionable).toBe(true);
    }
  });

  it('ENTP types are not actionable', () => {
    for (const meta of TYPE_REGISTRY.filter((t) => t.group === 'ENTP')) {
      expect(meta.actionable).toBe(false);
    }
  });

  it('project is one-and-done multi-sitting', () => {
    const meta = getTypeMeta('project');
    expect(meta.recurring).toBe(false);
    expect(meta.singleSitting).toBe(false);
  });

  it('operation is recurring single-sitting', () => {
    const meta = getTypeMeta('operation');
    expect(meta.recurring).toBe(true);
    expect(meta.singleSitting).toBe(true);
  });

  it('responsibility is recurring multi-sitting', () => {
    const meta = getTypeMeta('responsibility');
    expect(meta.recurring).toBe(true);
    expect(meta.singleSitting).toBe(false);
  });

  it('task is one-and-done single-sitting', () => {
    const meta = getTypeMeta('task');
    expect(meta.recurring).toBe(false);
    expect(meta.singleSitting).toBe(true);
  });

  it('getTypeGroup returns correct group', () => {
    expect(getTypeGroup('project')).toBe('PORT');
    expect(getTypeGroup('operation')).toBe('PORT');
    expect(getTypeGroup('event')).toBe('ENTP');
    expect(getTypeGroup('person')).toBe('ENTP');
  });
});

// ── buildPortentObject ───────────────────────────────────────────────────────

describe('buildPortentObject', () => {
  it('parses a project from frontmatter', () => {
    const content = `---
type: Project
title: Launch v0.1
organized: true
archived: false
belongs_to: "[[Maintain product line]]"
related_to:
  - "[[Knowledge graphs]]"
  - "[[Alice Example]]"
tags: [work, launch]
---

# Launch v0.1

Launch the Portent v0.1 website by end of quarter.`;

    const obj = buildPortentObject('projects/launch-v01.md', content);
    expect(obj).not.toBeNull();
    expect(obj!.type).toBe('project');
    expect(obj!.title).toBe('Launch v0.1');
    expect(obj!.lifecycle).toBe('organized');
    expect(obj!.organized).toBe(true);
    expect(obj!.archived).toBe(false);
    expect(obj!.belongsTo).toEqual(['Maintain product line']);
    expect(obj!.relatedTo).toContain('Knowledge graphs');
    expect(obj!.relatedTo).toContain('Alice Example');
    expect(obj!.tags).toContain('work');
  });

  it('parses a responsibility', () => {
    const content = `---
type: responsibility
organized: true
---

# Maintain Personal Health

Maintain long-running health outcomes.`;

    const obj = buildPortentObject('areas/health.md', content);
    expect(obj).not.toBeNull();
    expect(obj!.type).toBe('responsibility');
    expect(obj!.lifecycle).toBe('organized');
  });

  it('parses an event', () => {
    const content = `---
type: Event
related_to: "[[Alice Example]]"
---

# Meeting with Alice

Discussed Portent vocabulary.`;

    const obj = buildPortentObject('events/meeting-alice.md', content);
    expect(obj).not.toBeNull();
    expect(obj!.type).toBe('event');
    expect(obj!.relatedTo).toEqual(['Alice Example']);
  });

  it('parses a person', () => {
    const content = `---
type: person
tags: [contact, collaborator]
---

# Ada Lovelace`;

    const obj = buildPortentObject('people/ada.md', content);
    expect(obj).not.toBeNull();
    expect(obj!.type).toBe('person');
    expect(obj!.tags).toContain('contact');
  });

  it('parses a topic', () => {
    const content = `---
type: topic
---

# Knowledge Graphs`;

    const obj = buildPortentObject('topics/kg.md', content);
    expect(obj).not.toBeNull();
    expect(obj!.type).toBe('topic');
    expect(obj!.title).toBe('Knowledge Graphs');
  });

  it('parses a note', () => {
    const content = `---
type: note
belongs_to: "[[Knowledge Graphs]]"
---

# Why folders conflate model and view`;

    const obj = buildPortentObject('notes/folders.md', content);
    expect(obj).not.toBeNull();
    expect(obj!.type).toBe('note');
    expect(obj!.belongsTo).toEqual(['Knowledge Graphs']);
  });

  it('parses an operation', () => {
    const content = `---
type: operation
belongs_to: "[[Maintain personal health]]"
---

# Weekly Training Review`;

    const obj = buildPortentObject('ops/weekly-review.md', content);
    expect(obj).not.toBeNull();
    expect(obj!.type).toBe('operation');
    expect(obj!.belongsTo).toEqual(['Maintain personal health']);
  });

  it('parses a task', () => {
    const content = `---
type: task
belongs_to: "[[Launch v0.1]]"
---

# Book a padel court for Tuesday`;

    const obj = buildPortentObject('tasks/padel.md', content);
    expect(obj).not.toBeNull();
    expect(obj!.type).toBe('task');
  });

  it('returns null for non-Portent notes', () => {
    const content = `---
tags: [random]
---

# Just a regular note`;

    expect(buildPortentObject('random.md', content)).toBeNull();
  });

  it('returns null for unknown type', () => {
    const content = `---
type: widget
---

# Not a Portent type`;

    expect(buildPortentObject('widget.md', content)).toBeNull();
  });

  it('defaults to captured lifecycle when no metadata', () => {
    const content = `---
type: note
---

# A captured note`;

    const obj = buildPortentObject('inbox/captured.md', content);
    expect(obj!.lifecycle).toBe('captured');
    expect(obj!.organized).toBe(false);
    expect(obj!.archived).toBe(false);
  });

  it('resolves lifecycle from status field', () => {
    const content = `---
type: note
status: archived
---

# Old note`;

    const obj = buildPortentObject('archive/old.md', content);
    expect(obj!.lifecycle).toBe('archived');
    expect(obj!.archived).toBe(true);
  });

  it('resolves lifecycle from lifecycle field', () => {
    const content = `---
type: project
lifecycle: organized
---

# Active project`;

    const obj = buildPortentObject('projects/active.md', content);
    expect(obj!.lifecycle).toBe('organized');
    expect(obj!.organized).toBe(true);
  });

  it('handles type case-insensitively', () => {
    const content = `---
type: PROJECT
---

# Uppercase type`;

    const obj = buildPortentObject('test.md', content);
    expect(obj!.type).toBe('project');
  });

  it('extracts title from H1 when not in frontmatter', () => {
    const content = `---
type: note
---

# My Great Note

Content here.`;

    const obj = buildPortentObject('notes/great.md', content);
    expect(obj!.title).toBe('My Great Note');
  });

  it('falls back to filename when no title', () => {
    const content = `---
type: note
---

Content without heading.`;

    const obj = buildPortentObject('notes/my-note.md', content);
    expect(obj!.title).toBe('my-note');
  });

  it('handles plain text relationship values (no wikilinks)', () => {
    const content = `---
type: task
belongs_to: Launch v0.1
---

# Do the thing`;

    const obj = buildPortentObject('tasks/thing.md', content);
    expect(obj!.belongsTo).toEqual(['Launch v0.1']);
  });

  it('handles multiple wikilink relationships', () => {
    const content = `---
type: event
related_to:
  - "[[Alice]]"
  - "[[Bob]]"
  - "[[Charlie]]"
---

# Team meeting`;

    const obj = buildPortentObject('events/team.md', content);
    expect(obj!.relatedTo).toEqual(['Alice', 'Bob', 'Charlie']);
  });
});
