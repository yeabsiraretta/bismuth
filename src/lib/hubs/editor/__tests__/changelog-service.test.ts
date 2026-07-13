import { describe, expect, it } from 'vitest';

import {
  bumpVersion,
  compareSemVer,
  formatSemVer,
  parseSemVer,
  type SemVer,
} from '@/hubs/editor/services/changelog-service';

describe('parseSemVer', () => {
  it('parses a basic version', () => {
    expect(parseSemVer('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: '',
      build: '',
    });
  });

  it('parses version with prerelease', () => {
    expect(parseSemVer('1.0.0-alpha.1')).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: 'alpha.1',
      build: '',
    });
  });

  it('parses version with build metadata', () => {
    expect(parseSemVer('1.0.0+20130313144700')).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: '',
      build: '20130313144700',
    });
  });

  it('parses version with prerelease and build', () => {
    expect(parseSemVer('1.0.0-beta+exp.sha.5114f85')).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: 'beta',
      build: 'exp.sha.5114f85',
    });
  });

  it('returns null for invalid versions', () => {
    expect(parseSemVer('v1.2.3')).toBeNull();
    expect(parseSemVer('1.2')).toBeNull();
    expect(parseSemVer('abc')).toBeNull();
    expect(parseSemVer('01.2.3')).toBeNull();
  });

  it('parses 0.0.0', () => {
    expect(parseSemVer('0.0.0')).toEqual({
      major: 0,
      minor: 0,
      patch: 0,
      prerelease: '',
      build: '',
    });
  });
});

describe('formatSemVer', () => {
  it('formats basic version', () => {
    expect(formatSemVer({ major: 1, minor: 2, patch: 3, prerelease: '', build: '' })).toBe('1.2.3');
  });

  it('includes prerelease', () => {
    expect(formatSemVer({ major: 1, minor: 0, patch: 0, prerelease: 'rc.1', build: '' })).toBe(
      '1.0.0-rc.1'
    );
  });

  it('includes build', () => {
    expect(formatSemVer({ major: 1, minor: 0, patch: 0, prerelease: '', build: '001' })).toBe(
      '1.0.0+001'
    );
  });

  it('includes both prerelease and build', () => {
    expect(formatSemVer({ major: 1, minor: 0, patch: 0, prerelease: 'alpha', build: '001' })).toBe(
      '1.0.0-alpha+001'
    );
  });
});

describe('compareSemVer', () => {
  function sv(s: string): SemVer {
    return parseSemVer(s)!;
  }

  it('compares major versions', () => {
    expect(compareSemVer(sv('1.0.0'), sv('2.0.0'))).toBeLessThan(0);
    expect(compareSemVer(sv('2.0.0'), sv('1.0.0'))).toBeGreaterThan(0);
  });

  it('compares minor versions', () => {
    expect(compareSemVer(sv('1.0.0'), sv('1.1.0'))).toBeLessThan(0);
  });

  it('compares patch versions', () => {
    expect(compareSemVer(sv('1.0.0'), sv('1.0.1'))).toBeLessThan(0);
  });

  it('equal versions return 0', () => {
    expect(compareSemVer(sv('1.2.3'), sv('1.2.3'))).toBe(0);
  });

  it('prerelease < release', () => {
    expect(compareSemVer(sv('1.0.0-alpha'), sv('1.0.0'))).toBeLessThan(0);
  });

  it('compares prerelease identifiers per spec', () => {
    // 1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta
    expect(compareSemVer(sv('1.0.0-alpha'), sv('1.0.0-alpha.1'))).toBeLessThan(0);
    expect(compareSemVer(sv('1.0.0-alpha.1'), sv('1.0.0-alpha.beta'))).toBeLessThan(0);
    expect(compareSemVer(sv('1.0.0-alpha.beta'), sv('1.0.0-beta'))).toBeLessThan(0);
  });

  it('numeric identifiers < non-numeric', () => {
    expect(compareSemVer(sv('1.0.0-1'), sv('1.0.0-alpha'))).toBeLessThan(0);
  });

  it('numeric prerelease compared numerically', () => {
    expect(compareSemVer(sv('1.0.0-beta.2'), sv('1.0.0-beta.11'))).toBeLessThan(0);
  });
});

describe('bumpVersion', () => {
  function sv(s: string): SemVer {
    return parseSemVer(s)!;
  }

  it('bumps major', () => {
    expect(formatSemVer(bumpVersion(sv('1.2.3'), 'major'))).toBe('2.0.0');
  });

  it('bumps minor', () => {
    expect(formatSemVer(bumpVersion(sv('1.2.3'), 'minor'))).toBe('1.3.0');
  });

  it('bumps patch', () => {
    expect(formatSemVer(bumpVersion(sv('1.2.3'), 'patch'))).toBe('1.2.4');
  });

  it('bumps prerelease with default tag', () => {
    expect(formatSemVer(bumpVersion(sv('1.0.0'), 'prerelease'))).toBe('1.0.0-alpha.1');
  });

  it('increments existing prerelease', () => {
    expect(formatSemVer(bumpVersion(sv('1.0.0-alpha.1'), 'prerelease'))).toBe('1.0.0-alpha.2');
  });

  it('bumps prerelease with custom tag', () => {
    expect(formatSemVer(bumpVersion(sv('1.0.0'), 'prerelease', 'beta'))).toBe('1.0.0-beta.1');
  });

  it('switches prerelease tag', () => {
    expect(formatSemVer(bumpVersion(sv('1.0.0-alpha.3'), 'prerelease', 'beta'))).toBe(
      '1.0.0-beta.1'
    );
  });

  it('major resets minor and patch', () => {
    const bumped = bumpVersion(sv('2.5.9-rc.1'), 'major');
    expect(bumped.major).toBe(3);
    expect(bumped.minor).toBe(0);
    expect(bumped.patch).toBe(0);
    expect(bumped.prerelease).toBe('');
  });
});
