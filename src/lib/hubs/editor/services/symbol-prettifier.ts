export interface SymbolRule {
  trigger: string;
  replacement: string;
  enabled: boolean;
}

const WORD_BOUNDARY = /[\s.,;:!?()[\]{}'"]/;

export const DEFAULT_RULES: SymbolRule[] = [
  { trigger: '<->', replacement: '\u2194', enabled: true },
  { trigger: '<=>', replacement: '\u21D4', enabled: true },
  { trigger: '-->', replacement: '\u2192', enabled: true },
  { trigger: '<--', replacement: '\u2190', enabled: true },
  { trigger: '==>', replacement: '\u21D2', enabled: true },
  { trigger: '<==', replacement: '\u21D0', enabled: true },
  { trigger: '->', replacement: '\u2192', enabled: true },
  { trigger: '<-', replacement: '\u2190', enabled: true },
  { trigger: '=>', replacement: '\u21D2', enabled: true },
  { trigger: '<=', replacement: '\u21D0', enabled: true },
  { trigger: '>=', replacement: '\u2265', enabled: true },
  { trigger: '=<', replacement: '\u2264', enabled: true },
  { trigger: '!=', replacement: '\u2260', enabled: true },
  { trigger: '+-', replacement: '\u00B1', enabled: true },
  { trigger: '-+', replacement: '\u2213', enabled: true },
  { trigger: '...', replacement: '\u2026', enabled: true },
  { trigger: '---', replacement: '\u2014', enabled: true },
  { trigger: '--', replacement: '\u2013', enabled: true },
  { trigger: '<<', replacement: '\u00AB', enabled: true },
  { trigger: '>>', replacement: '\u00BB', enabled: true },
  { trigger: '(c)', replacement: '\u00A9', enabled: true },
  { trigger: '(r)', replacement: '\u00AE', enabled: true },
  { trigger: '(tm)', replacement: '\u2122', enabled: true },
  { trigger: '1/2', replacement: '\u00BD', enabled: true },
  { trigger: '1/4', replacement: '\u00BC', enabled: true },
  { trigger: '3/4', replacement: '\u00BE', enabled: true },
  { trigger: '~=', replacement: '\u2248', enabled: true },
  { trigger: 'inf', replacement: '\u221E', enabled: true },
  { trigger: 'deg', replacement: '\u00B0', enabled: true },
  { trigger: 'sqrt', replacement: '\u221A', enabled: true },
  { trigger: 'sum', replacement: '\u2211', enabled: true },
  { trigger: 'prod', replacement: '\u220F', enabled: true },
  { trigger: 'delta', replacement: '\u0394', enabled: true },
  { trigger: 'pi', replacement: '\u03C0', enabled: true },
  { trigger: 'alpha', replacement: '\u03B1', enabled: true },
  { trigger: 'beta', replacement: '\u03B2', enabled: true },
  { trigger: 'theta', replacement: '\u03B8', enabled: true },
  { trigger: 'lambda', replacement: '\u03BB', enabled: true },
  { trigger: 'omega', replacement: '\u03C9', enabled: true },
  { trigger: 'mu', replacement: '\u03BC', enabled: true },
  { trigger: 'sigma', replacement: '\u03C3', enabled: true },
];

export interface ReplacementMatch {
  triggerStart: number;
  triggerEnd: number;
  replacement: string;
}

export function isWordTrigger(trigger: string): boolean {
  return /^[a-zA-Z]+$/.test(trigger);
}

export function sortRules(rules: SymbolRule[]): SymbolRule[] {
  return [...rules].sort((a, b) => b.trigger.length - a.trigger.length);
}

export function findMatch(
  textBefore: string,
  inserted: string,
  rules: SymbolRule[],
  charAfter: string = ''
): ReplacementMatch | null {
  const combined = textBefore + inserted;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const { trigger, replacement } = rule;

    if (combined.length < trigger.length) continue;
    const candidateStart = combined.length - trigger.length;
    const candidate = combined.slice(candidateStart);

    if (candidate !== trigger) continue;

    if (isWordTrigger(trigger)) {
      const charBefore = candidateStart > 0 ? combined[candidateStart - 1] : '';
      if (charBefore && !WORD_BOUNDARY.test(charBefore)) continue;
      if (charAfter && !WORD_BOUNDARY.test(charAfter)) continue;
    }

    return { triggerStart: candidateStart, triggerEnd: combined.length, replacement };
  }

  return null;
}

export function prettifyText(text: string, rules: SymbolRule[]): string {
  const sorted = sortRules(rules.filter((r) => r.enabled));
  let result = text;

  for (const rule of sorted) {
    if (isWordTrigger(rule.trigger)) {
      const regex = new RegExp(
        `(?<=^|[\\s.,;:!?()\\[\\]{}'"])${escapeRegExp(rule.trigger)}(?=$|[\\s.,;:!?()\\[\\]{}'"])`,
        'g'
      );
      result = result.replace(regex, rule.replacement);
    } else {
      result = result.split(rule.trigger).join(rule.replacement);
    }
  }

  return result;
}

export function unprettifyText(text: string, rules: SymbolRule[]): string {
  const shortest = new Map<string, string>();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const existing = shortest.get(rule.replacement);
    if (!existing || rule.trigger.length < existing.length) {
      shortest.set(rule.replacement, rule.trigger);
    }
  }
  let result = text;
  for (const [replacement, trigger] of shortest) {
    result = result.split(replacement).join(trigger);
  }
  return result;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
