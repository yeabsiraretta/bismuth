/**
 * Symbol Prettifier types — mapping table, config, and replacement rule.
 *
 * Each rule maps an ASCII trigger sequence to a Unicode replacement.
 * Rules are tested longest-match-first to avoid prefix conflicts
 * (e.g. "<->" must be checked before "<-").
 */

export interface SymbolRule {
  trigger: string;
  replacement: string;
  enabled: boolean;
}

export interface SymbolPrettifierConfig {
  enabled: boolean;
  rules: SymbolRule[];
}

/** Built-in rules, ordered longest trigger first. */
export const DEFAULT_RULES: SymbolRule[] = [
  { trigger: '<->', replacement: '\u2194', enabled: true }, // ↔
  { trigger: '<=>', replacement: '\u21D4', enabled: true }, // ⇔
  { trigger: '-->', replacement: '\u2192', enabled: true }, // →  (long)
  { trigger: '<--', replacement: '\u2190', enabled: true }, // ←  (long)
  { trigger: '==>', replacement: '\u21D2', enabled: true }, // ⇒  (long)
  { trigger: '<==', replacement: '\u21D0', enabled: true }, // ⇐  (long)
  { trigger: '->', replacement: '\u2192', enabled: true }, // →
  { trigger: '<-', replacement: '\u2190', enabled: true }, // ←
  { trigger: '=>', replacement: '\u21D2', enabled: true }, // ⇒
  { trigger: '<=', replacement: '\u21D0', enabled: true }, // ⇐
  { trigger: '>=', replacement: '\u2265', enabled: true }, // ≥
  { trigger: '=<', replacement: '\u2264', enabled: true }, // ≤
  { trigger: '!=', replacement: '\u2260', enabled: true }, // ≠
  { trigger: '+-', replacement: '\u00B1', enabled: true }, // ±
  { trigger: '-+', replacement: '\u2213', enabled: true }, // ∓
  { trigger: '...', replacement: '\u2026', enabled: true }, // …
  { trigger: '---', replacement: '\u2014', enabled: true }, // — em dash
  { trigger: '--', replacement: '\u2013', enabled: true }, // – en dash
  { trigger: '<<', replacement: '\u00AB', enabled: true }, // «
  { trigger: '>>', replacement: '\u00BB', enabled: true }, // »
  { trigger: '(c)', replacement: '\u00A9', enabled: true }, // ©
  { trigger: '(r)', replacement: '\u00AE', enabled: true }, // ®
  { trigger: '(tm)', replacement: '\u2122', enabled: true }, // ™
  { trigger: '1/2', replacement: '\u00BD', enabled: true }, // ½
  { trigger: '1/4', replacement: '\u00BC', enabled: true }, // ¼
  { trigger: '3/4', replacement: '\u00BE', enabled: true }, // ¾
  { trigger: '~=', replacement: '\u2248', enabled: true }, // ≈
  { trigger: 'inf', replacement: '\u221E', enabled: true }, // ∞
  { trigger: 'deg', replacement: '\u00B0', enabled: true }, // °
  { trigger: 'sqrt', replacement: '\u221A', enabled: true }, // √
  { trigger: 'sum', replacement: '\u2211', enabled: true }, // ∑
  { trigger: 'prod', replacement: '\u220F', enabled: true }, // ∏
  { trigger: 'delta', replacement: '\u0394', enabled: true }, // Δ
  { trigger: 'pi', replacement: '\u03C0', enabled: true }, // π
  { trigger: 'alpha', replacement: '\u03B1', enabled: true }, // α
  { trigger: 'beta', replacement: '\u03B2', enabled: true }, // β
  { trigger: 'theta', replacement: '\u03B8', enabled: true }, // θ
  { trigger: 'lambda', replacement: '\u03BB', enabled: true }, // λ
  { trigger: 'omega', replacement: '\u03C9', enabled: true }, // ω
  { trigger: 'mu', replacement: '\u03BC', enabled: true }, // μ
  { trigger: 'sigma', replacement: '\u03C3', enabled: true }, // σ
];

export const DEFAULT_CONFIG: SymbolPrettifierConfig = {
  enabled: true,
  rules: DEFAULT_RULES.map((r) => ({ ...r })),
};

/** Characters that mark the end of a word/trigger for word-boundary rules. */
export const WORD_BOUNDARY = /[\s.,;:!?()[\]{}'"]/;
