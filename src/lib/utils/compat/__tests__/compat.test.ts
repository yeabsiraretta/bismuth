import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }),
  length: 0,
  key: vi.fn(() => null),
});

vi.stubGlobal('crypto', { randomUUID: () => 'test-session' });

import {
  parseSemver,
  compareSemver,
  versionedRead,
  versionedWrite,
  getAppVersion,
} from '../compat';
import { schemaRegistry } from '../registry';
import type { VersionEnvelope } from '../types';

describe('semver utilities', () => {
  it('parseSemver parses valid versions', () => {
    expect(parseSemver('1.2.3')).toEqual([1, 2, 3]);
    expect(parseSemver('0.3.0')).toEqual([0, 3, 0]);
    expect(parseSemver('v2.0.1')).toEqual([2, 0, 1]);
  });

  it('parseSemver handles malformed versions', () => {
    expect(parseSemver('')).toEqual([0, 0, 0]);
    expect(parseSemver('1')).toEqual([1, 0, 0]);
    expect(parseSemver('1.2')).toEqual([1, 2, 0]);
  });

  it('compareSemver compares correctly', () => {
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('0.2.0', '0.3.0')).toBe(-1);
    expect(compareSemver('0.4.0', '0.3.0')).toBe(1);
    expect(compareSemver('1.0.0', '0.9.9')).toBe(1);
    expect(compareSemver('0.3.1', '0.3.0')).toBe(1);
    expect(compareSemver('2.0.0', '1.99.99')).toBe(1);
  });
});

describe('schemaRegistry', () => {
  beforeEach(() => {
    // Registry is a singleton, so we work with test schemas
  });

  it('register and retrieve schema', () => {
    schemaRegistry.register({
      id: 'test-schema-1',
      currentVersion: 1,
      minReaderVersion: '0.1.0',
      migrations: [],
      defaultValue: () => ({ foo: 'bar' }),
    });

    expect(schemaRegistry.has('test-schema-1')).toBe(true);
    const def = schemaRegistry.get('test-schema-1');
    expect(def?.currentVersion).toBe(1);
  });

  it('getMigrations returns correct chain', () => {
    const m1to2 = (data: unknown) => ({ ...(data as Record<string, unknown>), v2: true });
    const m2to3 = (data: unknown) => ({ ...(data as Record<string, unknown>), v3: true });

    schemaRegistry.register({
      id: 'test-schema-migrated',
      currentVersion: 3,
      minReaderVersion: '0.1.0',
      migrations: [m1to2, m2to3],
      defaultValue: () => ({}),
    });

    const chain = schemaRegistry.getMigrations('test-schema-migrated', 1, 3);
    expect(chain).toHaveLength(2);

    const chain2 = schemaRegistry.getMigrations('test-schema-migrated', 2, 3);
    expect(chain2).toHaveLength(1);
  });
});

describe('versionedRead', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it('returns fallback for empty storage', () => {
    const { data, result } = versionedRead<string>('nonexistent-key', 'default');
    expect(data).toBe('default');
    expect(result.compatible).toBe(true);
  });

  it('reads legacy (pre-envelope) data and treats as v1', () => {
    schemaRegistry.register({
      id: 'test-legacy',
      currentVersion: 1,
      minReaderVersion: '0.1.0',
      migrations: [],
      defaultValue: () => ({}),
    });

    mockStorage['test-legacy'] = JSON.stringify({ name: 'legacy' });
    const { data, result } = versionedRead<{ name: string }>('test-legacy', { name: '' });
    expect(data).toEqual({ name: 'legacy' });
    expect(result.compatible).toBe(true);
  });

  it('reads enveloped data correctly', () => {
    schemaRegistry.register({
      id: 'test-envelope-read',
      currentVersion: 1,
      minReaderVersion: '0.1.0',
      migrations: [],
      defaultValue: () => ({}),
    });

    const envelope: VersionEnvelope = {
      schemaId: 'test-envelope-read',
      schemaVersion: 1,
      writerVersion: '0.3.0',
      minReaderVersion: '0.1.0',
      writtenAt: new Date().toISOString(),
      data: { hello: 'world' },
    };
    mockStorage['test-envelope-read'] = JSON.stringify(envelope);

    const { data, result } = versionedRead<{ hello: string }>('test-envelope-read', { hello: '' });
    expect(data).toEqual({ hello: 'world' });
    expect(result.compatible).toBe(true);
    expect(result.envelope).toBeDefined();
  });

  it('runs migrations on older schema versions', () => {
    const m1to2 = (d: unknown) => ({ ...(d as Record<string, unknown>), migrated: true });
    schemaRegistry.register({
      id: 'test-migrate',
      currentVersion: 2,
      minReaderVersion: '0.1.0',
      migrations: [m1to2],
      defaultValue: () => ({}),
    });

    const envelope: VersionEnvelope = {
      schemaId: 'test-migrate',
      schemaVersion: 1,
      writerVersion: '0.2.0',
      minReaderVersion: '0.1.0',
      writtenAt: new Date().toISOString(),
      data: { original: true },
    };
    mockStorage['test-migrate'] = JSON.stringify(envelope);

    const { data, result } = versionedRead<{ original: boolean; migrated: boolean }>(
      'test-migrate',
      { original: false, migrated: false }
    );
    expect(data.original).toBe(true);
    expect(data.migrated).toBe(true);
    expect(result.migrationsApplied).toBe(1);
  });

  it('returns fallback for corrupt data', () => {
    mockStorage['test-corrupt'] = '{invalid json!!!';
    const { data, result } = versionedRead<string>('test-corrupt', 'safe-default');
    expect(data).toBe('safe-default');
    expect(result.compatible).toBe(false);
    expect(result.reason).toBe('corrupt');
  });

  it('returns fallback when writer requires newer reader', () => {
    schemaRegistry.register({
      id: 'test-future',
      currentVersion: 1,
      minReaderVersion: '0.1.0',
      migrations: [],
      defaultValue: () => ({}),
    });

    const envelope: VersionEnvelope = {
      schemaId: 'test-future',
      schemaVersion: 99,
      writerVersion: '99.0.0',
      minReaderVersion: '98.0.0',
      writtenAt: new Date().toISOString(),
      data: { future: true },
    };
    mockStorage['test-future'] = JSON.stringify(envelope);

    const { data, result } = versionedRead<Record<string, unknown>>('test-future', {
      fallback: true,
    });
    expect(data).toEqual({ fallback: true });
    expect(result.compatible).toBe(false);
    expect(result.reason).toBe('version_too_new');
  });
});

describe('versionedWrite', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it('writes a valid version envelope', () => {
    schemaRegistry.register({
      id: 'test-write',
      currentVersion: 1,
      minReaderVersion: '0.1.0',
      migrations: [],
      defaultValue: () => ({}),
    });

    versionedWrite('test-write', { foo: 'bar' });

    const stored = mockStorage['test-write'];
    expect(stored).toBeDefined();
    const envelope: VersionEnvelope = JSON.parse(stored);
    expect(envelope.schemaId).toBe('test-write');
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.writerVersion).toBe(getAppVersion());
    expect(envelope.data).toEqual({ foo: 'bar' });
    expect(envelope.writtenAt).toBeDefined();
  });

  it('roundtrips correctly', () => {
    schemaRegistry.register({
      id: 'test-roundtrip',
      currentVersion: 1,
      minReaderVersion: '0.1.0',
      migrations: [],
      defaultValue: () => ({}),
    });

    const original = { count: 42, items: ['a', 'b'] };
    versionedWrite('test-roundtrip', original);

    const { data } = versionedRead<typeof original>('test-roundtrip', { count: 0, items: [] });
    expect(data).toEqual(original);
  });
});
