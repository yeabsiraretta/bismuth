/**
 * Property template rendering helpers.
 *
 * Handlebars-style template rendering, number abbreviation,
 * and duration formatting for Pretty Properties.
 */

// ─── Number helpers ─────────────────────────────────────────────────────────

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

export function abbreviateNumber(n: number): string {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return String(n);
}

// ─── Duration helpers ───────────────────────────────────────────────────────

function toSeconds(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'ms':
    case 'milliseconds':
      return value / 1000;
    case 's':
    case 'seconds':
      return value;
    case 'm':
    case 'minutes':
      return value * 60;
    case 'h':
    case 'hours':
      return value * 3600;
    case 'd':
    case 'days':
      return value * 86400;
    default:
      return value;
  }
}

export function humanizeDuration(value: number, unit: string, withSuffix: boolean): string {
  if (isNaN(value)) return '';
  const totalSec = toSeconds(value, unit);
  const mins = Math.round(totalSec / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  let text: string;
  if (days > 0) text = `${days} day${days > 1 ? 's' : ''}`;
  else if (hours > 0) text = `${hours} hour${hours > 1 ? 's' : ''}`;
  else if (mins > 0) text = `${mins} minute${mins > 1 ? 's' : ''}`;
  else text = `${Math.round(totalSec)} second${totalSec !== 1 ? 's' : ''}`;

  if (withSuffix) return totalSec >= 0 ? `in ${text}` : `${text} ago`;
  return text;
}

export function formatDuration(value: number, unit: string, fmt: string): string {
  if (isNaN(value)) return '';
  let totalSec = Math.abs(toSeconds(value, unit));
  const h = Math.floor(totalSec / 3600);
  totalSec %= 3600;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return fmt.replace(/HH/g, pad(h)).replace(/mm/g, pad(m)).replace(/ss/g, pad(s));
}

export function abbreviateDuration(value: number, unit: string): string {
  if (isNaN(value)) return '';
  let totalSec = Math.abs(toSeconds(value, unit));
  const parts: string[] = [];
  const h = Math.floor(totalSec / 3600);
  totalSec %= 3600;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${pad(m)}m`);
  parts.push(`${pad(s)}s`);
  return parts.join(' ');
}

// ─── Template rendering ─────────────────────────────────────────────────────

/**
 * Render a simple Handlebars-style template.
 * Supports: {{propertyValue}}, {{propertyName}}, {{reverse val}},
 * {{uppercase val}}, {{lowercase val}}, {{round val}}.
 */
export function renderPropertyTemplate(
  template: string,
  propertyName: string,
  propertyValue: unknown
): string {
  const val = String(propertyValue ?? '');
  let result = template;

  // Simple variable substitution
  result = result.replace(/\{\{propertyValue\}\}/g, val);
  result = result.replace(/\{\{propertyName\}\}/g, propertyName);

  // Helper functions
  result = result.replace(/\{\{reverse\s+propertyValue\}\}/g, val.split('').reverse().join(''));
  result = result.replace(/\{\{uppercase\s+propertyValue\}\}/g, val.toUpperCase());
  result = result.replace(/\{\{lowercase\s+propertyValue\}\}/g, val.toLowerCase());

  const numVal = parseFloat(val);
  if (!isNaN(numVal)) {
    result = result.replace(/\{\{round\s+propertyValue\}\}/g, String(Math.round(numVal)));
    result = result.replace(/\{\{toAbbr\s+propertyValue\}\}/g, abbreviateNumber(numVal));
  }

  // Duration helpers
  result = result.replace(
    /\{\{durationHumanized\s+propertyValue\s+"(\w+)"(?:\s+(true|false))?\}\}/g,
    (_, unit: string, withSuffix: string) => {
      return humanizeDuration(numVal, unit, withSuffix === 'true');
    }
  );
  result = result.replace(
    /\{\{durationFormatted\s+propertyValue\s+"(\w+)"\s+"([^"]+)"\}\}/g,
    (_, unit: string, fmt: string) => {
      return formatDuration(numVal, unit, fmt);
    }
  );
  result = result.replace(
    /\{\{durationAbbreviated\s+propertyValue\s+"(\w+)"\}\}/g,
    (_, unit: string) => {
      return abbreviateDuration(numVal, unit);
    }
  );

  return result;
}
