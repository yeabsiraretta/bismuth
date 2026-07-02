/**
 * Unit tests for imageConverter service — resize dimension computation
 * and imageRename variable expansion.
 */

import { describe, it, expect } from 'vitest';
import { computeResizeDimensions } from '../services/imageConverter';
import {
  applyRenamePattern,
  extractBaseName,
  extractDir,
  buildOutputPath,
} from '../services/imageRename';
import type { RenameConfig } from '../types/media';

describe('computeResizeDimensions', () => {
  const W = 1920;
  const H = 1080;

  it('resizes by width preserving aspect', () => {
    const d = computeResizeDimensions(W, H, 'width', 960);
    expect(d.width).toBe(960);
    expect(d.height).toBe(540);
  });

  it('resizes by height preserving aspect', () => {
    const d = computeResizeDimensions(W, H, 'height', 540);
    expect(d.width).toBe(960);
    expect(d.height).toBe(540);
  });

  it('resizes by longest edge (landscape)', () => {
    const d = computeResizeDimensions(W, H, 'longest-edge', 800);
    expect(d.width).toBe(800);
    expect(d.height).toBe(450);
  });

  it('resizes by longest edge (portrait)', () => {
    const d = computeResizeDimensions(1080, 1920, 'longest-edge', 800);
    expect(d.height).toBe(800);
    expect(d.width).toBe(450);
  });

  it('resizes by shortest edge (landscape)', () => {
    const d = computeResizeDimensions(W, H, 'shortest-edge', 400);
    expect(d.height).toBe(400);
    expect(d.width).toBe(711);
  });

  it('resizes by shortest edge (portrait)', () => {
    const d = computeResizeDimensions(1080, 1920, 'shortest-edge', 400);
    expect(d.width).toBe(400);
    expect(d.height).toBe(711);
  });

  it('fit mode scales to fit within bounds', () => {
    const d = computeResizeDimensions(W, H, 'fit', 500);
    expect(d.width).toBeLessThanOrEqual(500);
    expect(d.height).toBeLessThanOrEqual(500);
    // aspect preserved
    expect(Math.abs(d.width / d.height - W / H)).toBeLessThan(0.02);
  });

  it('fill mode sets both dimensions to value', () => {
    const d = computeResizeDimensions(W, H, 'fill', 512);
    expect(d.width).toBe(512);
    expect(d.height).toBe(512);
  });
});

describe('applyRenamePattern', () => {
  it('replaces {noteName} and {fileName}', () => {
    const result = applyRenamePattern('{noteName}-{fileName}', {
      noteName: 'MyNote',
      fileName: 'photo',
      index: 1,
    });
    expect(result).toBe('MyNote-photo');
  });

  it('replaces {index} with zero-padded value', () => {
    const result = applyRenamePattern('img-{index}', {
      noteName: '',
      fileName: '',
      index: 7,
    });
    expect(result).toBe('img-007');
  });

  it('replaces {date} with YYYY-MM-DD format', () => {
    const result = applyRenamePattern('{date}', { noteName: '', fileName: '', index: 1 });
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('replaces {time} with HHmmss format', () => {
    const result = applyRenamePattern('{time}', { noteName: '', fileName: '', index: 1 });
    expect(result).toMatch(/^\d{6}$/);
  });
});

describe('extractBaseName', () => {
  it('strips extension', () => {
    expect(extractBaseName('photos/cat.jpg')).toBe('cat');
  });

  it('handles no extension', () => {
    expect(extractBaseName('README')).toBe('README');
  });

  it('handles nested path', () => {
    expect(extractBaseName('/vault/images/sunset.png')).toBe('sunset');
  });
});

describe('extractDir', () => {
  it('returns parent directory', () => {
    expect(extractDir('/vault/images/cat.jpg')).toBe('/vault/images');
  });

  it('returns empty for no slash', () => {
    expect(extractDir('file.txt')).toBe('');
  });
});

describe('buildOutputPath', () => {
  it('builds path with default rename (disabled)', () => {
    const config: RenameConfig = { enabled: false, pattern: '', outputFolder: '' };
    const result = buildOutputPath('/vault/images', config, 'webp', {
      noteName: 'Note',
      fileName: 'photo',
      index: 1,
    });
    expect(result).toBe('/vault/images/photo.webp');
  });

  it('builds path with custom rename pattern', () => {
    const config: RenameConfig = { enabled: true, pattern: '{noteName}-{index}', outputFolder: '' };
    const result = buildOutputPath('/vault/edits', config, 'jpeg', {
      noteName: 'Daily',
      fileName: 'original',
      index: 3,
    });
    expect(result).toBe('/vault/edits/Daily-003.jpg');
  });

  it('builds path with custom output folder', () => {
    const config: RenameConfig = { enabled: false, pattern: '', outputFolder: 'converted' };
    const result = buildOutputPath('/vault', config, 'png', {
      noteName: '',
      fileName: 'img',
      index: 1,
    });
    expect(result).toBe('/vault/converted/img.png');
  });
});
