/**
 * Chem feature module — SMILES chemical structure rendering.
 * Public API barrel.
 */

// Types
export type { SmilesEntry, SmilesBlock, InlineSmiles, ChemTheme, ChemConfig } from './types';
export { DEFAULT_CHEM_CONFIG } from './types';

// Services — parser
export {
  parseSmilesLine,
  parseSmilesBlock,
  findSmilesBlocks,
  findInlineSmiles,
  sampleSmilesBlock,
} from './services/smilesParser';

// Services — extension
export { smilesExtension, updateSmilesExtensionConfig } from './services/smilesExtension';

// Stores
export {
  chemConfig,
  updateChemConfig,
  resetChemConfig,
  getChemConfig,
  setChemSize,
  toggleInlineSmiles,
  onChemConfigChange,
} from './stores/chemStore';
