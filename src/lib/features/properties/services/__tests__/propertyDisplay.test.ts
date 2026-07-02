import { describe, it, expect } from 'vitest';
import {
  resolveCoverSrc,
  getCoverDimensions,
  resolveIcon,
  formatDate,
  getRelativeDate,
  calculateProgress,
  getPropertyValueColor,
  setPropertyValueColor,
  getTagColor,
  renderPropertyTemplate,
  isPropertyHidden,
  togglePropertyHidden,
} from '../propertyDisplay';

// ─── Cover ──────────────────────────────────────────────────────────────────

describe('resolveCoverSrc', () => {
  it('returns empty for empty value', () => {
    expect(resolveCoverSrc('')).toBe('');
  });

  it('returns URLs as-is', () => {
    expect(resolveCoverSrc('https://img.com/cover.jpg')).toBe('https://img.com/cover.jpg');
    expect(resolveCoverSrc('http://img.com/cover.jpg')).toBe('http://img.com/cover.jpg');
  });

  it('prepends vault root for local paths', () => {
    expect(resolveCoverSrc('images/cover.png', '/vault')).toBe('/vault/images/cover.png');
  });

  it('strips leading slash from local paths', () => {
    expect(resolveCoverSrc('/images/cover.png', '/vault')).toBe('/vault/images/cover.png');
  });
});

describe('getCoverDimensions', () => {
  const widths = { initial: 120, vertical: 100, horizontal: 180, square: 120, circle: 100 };

  it('returns circle dimensions', () => {
    const d = getCoverDimensions('circle', widths);
    expect(d.width).toBe(100);
    expect(d.height).toBe(100);
    expect(d.borderRadius).toBe('50%');
  });

  it('returns square dimensions', () => {
    const d = getCoverDimensions('square', widths);
    expect(d.width).toBe(120);
    expect(d.height).toBe(120);
  });

  it('returns vertical dimensions (1.5x height)', () => {
    const d = getCoverDimensions('vertical', widths);
    expect(d.width).toBe(100);
    expect(d.height).toBe(150);
  });

  it('returns horizontal dimensions (0.6x height)', () => {
    const d = getCoverDimensions('horizontal', widths);
    expect(d.width).toBe(180);
    expect(d.height).toBe(108);
  });

  it('returns auto height for initial', () => {
    const d = getCoverDimensions('initial', widths);
    expect(d.height).toBe('auto');
  });
});

// ─── Icon ───────────────────────────────────────────────────────────────────

describe('resolveIcon', () => {
  it('resolves lucide icon names', () => {
    expect(resolveIcon('star')).toEqual({ source: 'lucide', value: 'star' });
    expect(resolveIcon('book-open')).toEqual({ source: 'lucide', value: 'book-open' });
  });

  it('resolves image URLs', () => {
    const r = resolveIcon('https://img.com/icon.png');
    expect(r.source).toBe('image');
  });

  it('resolves image file paths', () => {
    const r = resolveIcon('icons/my-icon.svg');
    expect(r.source).toBe('image');
  });

  it('resolves emoji as first character', () => {
    expect(resolveIcon('Hello')).toEqual({ source: 'emoji', value: 'H' });
  });

  it('handles empty string', () => {
    expect(resolveIcon('')).toEqual({ source: 'emoji', value: '' });
  });
});

// ─── Date formatting ────────────────────────────────────────────────────────

describe('formatDate', () => {
  const d = new Date(2024, 2, 15, 14, 30, 45); // March 15, 2024 2:30:45 PM

  it('formats YYYY-MM-DD', () => {
    expect(formatDate(d, 'YYYY-MM-DD')).toBe('2024-03-15');
  });

  it('formats with month name', () => {
    expect(formatDate(d, 'MMMM DD, YYYY')).toBe('March 15, 2024');
  });

  it('formats short month', () => {
    expect(formatDate(d, 'MMM DD')).toBe('Mar 15');
  });

  it('formats time HH:mm:ss', () => {
    expect(formatDate(d, 'HH:mm:ss')).toBe('14:30:45');
  });

  it('formats 12-hour time', () => {
    const result = formatDate(d, 'hh:mm A');
    expect(result).toBe('02:30 PM');
  });

  it('formats day of week', () => {
    expect(formatDate(d, 'dddd')).toBe('Friday');
  });

  it('formats ordinal day', () => {
    expect(formatDate(d, 'Do')).toBe('15th');
  });
});

describe('getRelativeDate', () => {
  it('returns past for yesterday', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(getRelativeDate(d)).toBe('past');
  });

  it('returns present for today', () => {
    expect(getRelativeDate(new Date())).toBe('present');
  });

  it('returns future for tomorrow', () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    expect(getRelativeDate(d)).toBe('future');
  });
});

// ─── Progress bars ──────────────────────────────────────────────────────────

describe('calculateProgress', () => {
  it('calculates percentage with default max', () => {
    const result = calculateProgress({ score: 75 }, { property: 'score', max: 100 });
    expect(result.percent).toBe(75);
    expect(result.label).toBe('75/100');
  });

  it('clamps to max', () => {
    const result = calculateProgress({ score: 150 }, { property: 'score', max: 100 });
    expect(result.percent).toBe(100);
    expect(result.value).toBe(100);
  });

  it('uses maxProperty when specified', () => {
    const result = calculateProgress(
      { score: 3, maxScore: 10 },
      { property: 'score', max: 100, maxProperty: 'maxScore' }
    );
    expect(result.percent).toBe(30);
    expect(result.max).toBe(10);
  });

  it('handles zero value', () => {
    const result = calculateProgress({ score: 0 }, { property: 'score', max: 100 });
    expect(result.percent).toBe(0);
  });

  it('handles string values', () => {
    const result = calculateProgress({ score: '42' }, { property: 'score', max: 100 });
    expect(result.percent).toBe(42);
  });
});

// ─── Property colors ────────────────────────────────────────────────────────

describe('property colors', () => {
  it('returns null for no color', () => {
    expect(getPropertyValueColor({}, 'status', 'active')).toBeNull();
  });

  it('finds assigned color', () => {
    const colors = { status: [{ value: 'active', color: '#00ff00' }] };
    expect(getPropertyValueColor(colors, 'status', 'active')).toBe('#00ff00');
  });

  it('returns null for unmatched value', () => {
    const colors = { status: [{ value: 'active', color: '#00ff00' }] };
    expect(getPropertyValueColor(colors, 'status', 'inactive')).toBeNull();
  });

  it('sets a new color', () => {
    const result = setPropertyValueColor({}, 'status', 'active', '#ff0000');
    expect(result['status']).toHaveLength(1);
    expect(result['status'][0]).toEqual({ value: 'active', color: '#ff0000' });
  });

  it('updates existing color', () => {
    const existing = { status: [{ value: 'active', color: '#00ff00' }] };
    const result = setPropertyValueColor(existing, 'status', 'active', '#ff0000');
    expect(result['status'][0].color).toBe('#ff0000');
  });

  it('removes color with null', () => {
    const existing = { status: [{ value: 'active', color: '#00ff00' }] };
    const result = setPropertyValueColor(existing, 'status', 'active', null);
    expect(result['status']).toHaveLength(0);
  });
});

// ─── Tag colors ─────────────────────────────────────────────────────────────

describe('getTagColor', () => {
  const tags = [
    { tag: 'important', color: '#ff0000' },
    { tag: 'idea', color: '#0000ff' },
  ];

  it('finds tag color', () => {
    expect(getTagColor(tags, 'important')).toBe('#ff0000');
  });

  it('strips # prefix', () => {
    expect(getTagColor(tags, '#idea')).toBe('#0000ff');
  });

  it('returns null for unknown tag', () => {
    expect(getTagColor(tags, 'unknown')).toBeNull();
  });
});

// ─── Templates ──────────────────────────────────────────────────────────────

describe('renderPropertyTemplate', () => {
  it('substitutes propertyValue', () => {
    expect(renderPropertyTemplate('Value: {{propertyValue}}', 'key', 'hello')).toBe('Value: hello');
  });

  it('substitutes propertyName', () => {
    expect(renderPropertyTemplate('{{propertyName}}: {{propertyValue}}', 'status', 'active')).toBe(
      'status: active'
    );
  });

  it('applies reverse helper', () => {
    expect(renderPropertyTemplate('{{reverse propertyValue}}', 'key', 'abc')).toBe('cba');
  });

  it('applies uppercase helper', () => {
    expect(renderPropertyTemplate('{{uppercase propertyValue}}', 'key', 'hello')).toBe('HELLO');
  });

  it('applies lowercase helper', () => {
    expect(renderPropertyTemplate('{{lowercase propertyValue}}', 'key', 'HELLO')).toBe('hello');
  });

  it('abbreviates large numbers', () => {
    expect(renderPropertyTemplate('{{toAbbr propertyValue}}', 'key', 1234567)).toBe('1.23M');
  });

  it('rounds numbers', () => {
    expect(renderPropertyTemplate('{{round propertyValue}}', 'key', 3.7)).toBe('4');
  });

  it('formats duration humanized', () => {
    const result = renderPropertyTemplate(
      '{{durationHumanized propertyValue "s" true}}',
      'dur',
      829
    );
    expect(result).toBe('in 14 minutes');
  });

  it('formats duration formatted', () => {
    const result = renderPropertyTemplate(
      '{{durationFormatted propertyValue "seconds" "HH:mm:ss"}}',
      'dur',
      829
    );
    expect(result).toBe('00:13:49');
  });

  it('formats duration abbreviated', () => {
    const result = renderPropertyTemplate('{{durationAbbreviated propertyValue "s"}}', 'dur', 829);
    expect(result).toBe('13m 49s');
  });
});

// ─── Hidden properties ──────────────────────────────────────────────────────

describe('hidden properties', () => {
  it('detects hidden property', () => {
    expect(isPropertyHidden(['cover', 'banner'], 'cover')).toBe(true);
    expect(isPropertyHidden(['cover', 'banner'], 'title')).toBe(false);
  });

  it('toggles hide on', () => {
    const result = togglePropertyHidden([], 'cover');
    expect(result).toContain('cover');
  });

  it('toggles hide off', () => {
    const result = togglePropertyHidden(['cover', 'banner'], 'cover');
    expect(result).not.toContain('cover');
    expect(result).toContain('banner');
  });
});
