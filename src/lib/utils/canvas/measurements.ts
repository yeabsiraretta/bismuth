/**
 * Measurement Guides & Rulers System (T138)
 *
 * Barrel re-export — implementation split into measurements/ directory.
 */

export type { Measurement, AlignmentGuide, RulerTick } from './measurements/index';
export { measureBetween, measureToParent } from './measurements/distance';
export { computeAlignmentGuides, generateRulerTicks, snapToGuide, snapToTokenSpacing } from './measurements/alignment';
