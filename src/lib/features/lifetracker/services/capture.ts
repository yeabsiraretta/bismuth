/**
 * Capture service — property capture logic, validation, batch processing,
 * auto-save to frontmatter.
 */
import { updateFrontmatterField } from '@/services/frontmatter';
import { log } from '@/utils/logger';
import type { PropertyDefinition, PropertyConstraints, PropertyType } from '../types';

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateValue(
  value: unknown,
  type: PropertyType,
  constraints?: PropertyConstraints,
): { valid: boolean; error?: string } {
  if (value === undefined || value === null || value === '') {
    return { valid: true };
  }

  switch (type) {
    case 'number': {
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(num)) return { valid: false, error: 'Must be a number' };
      if (constraints?.min !== undefined && num < constraints.min) {
        return { valid: false, error: `Minimum is ${constraints.min}` };
      }
      if (constraints?.max !== undefined && num > constraints.max) {
        return { valid: false, error: `Maximum is ${constraints.max}` };
      }
      return { valid: true };
    }
    case 'text': {
      const str = String(value);
      if (constraints?.allowedValues?.length && !constraints.allowedValues.includes(str)) {
        return { valid: false, error: `Must be one of: ${constraints.allowedValues.join(', ')}` };
      }
      return { valid: true };
    }
    case 'checkbox':
      return { valid: typeof value === 'boolean' || value === 'true' || value === 'false' };
    case 'date':
      return { valid: /^\d{4}-\d{2}-\d{2}/.test(String(value)) };
    case 'list':
    case 'tags':
      return { valid: Array.isArray(value) || typeof value === 'string' };
    default:
      return { valid: true };
  }
}

/** Coerce a raw input value to the expected type */
export function coerceValue(value: unknown, type: PropertyType): unknown {
  if (value === undefined || value === null || value === '') return undefined;

  switch (type) {
    case 'number': return typeof value === 'number' ? value : parseFloat(String(value));
    case 'checkbox': return typeof value === 'boolean' ? value : String(value) === 'true';
    case 'date': return String(value).slice(0, 10);
    case 'list':
    case 'tags': {
      if (Array.isArray(value)) return value;
      return String(value).split(',').map(s => s.trim()).filter(Boolean);
    }
    default: return String(value);
  }
}

// ─── Save to frontmatter ─────────────────────────────────────────────────────

export async function savePropertyValue(
  path: string,
  propertyName: string,
  value: unknown,
): Promise<boolean> {
  try {
    await updateFrontmatterField(path, propertyName, value);
    log.info('Saved property value', { path, property: propertyName });
    return true;
  } catch (error) {
    log.error('Failed to save property value', error as Error);
    return false;
  }
}

/** Save multiple property values to a note in sequence */
export async function saveAllProperties(
  path: string,
  values: Record<string, unknown>,
  definitions: PropertyDefinition[],
): Promise<{ saved: number; errors: string[] }> {
  let saved = 0;
  const errors: string[] = [];

  for (const def of definitions) {
    const raw = values[def.name];
    if (raw === undefined) continue;

    const coerced = coerceValue(raw, def.type);
    const validation = validateValue(coerced, def.type, def.constraints);

    if (!validation.valid) {
      errors.push(`${def.name}: ${validation.error ?? 'Invalid'}`);
      continue;
    }

    if (coerced !== undefined) {
      const ok = await savePropertyValue(path, def.name, coerced);
      if (ok) saved++; else errors.push(`${def.name}: Save failed`);
    }
  }

  return { saved, errors };
}

// ─── Batch processing helpers ────────────────────────────────────────────────

/** Check which properties are missing from a note's frontmatter */
export function missingProperties(
  frontmatter: Record<string, unknown>,
  definitions: PropertyDefinition[],
): PropertyDefinition[] {
  return definitions.filter(def => {
    const val = frontmatter[def.name];
    return val === undefined || val === null || val === '';
  });
}

/** Check if all required properties are filled */
export function isComplete(
  frontmatter: Record<string, unknown>,
  definitions: PropertyDefinition[],
): boolean {
  return missingProperties(frontmatter, definitions).length === 0;
}

/** Get completion percentage */
export function completionPercent(
  frontmatter: Record<string, unknown>,
  definitions: PropertyDefinition[],
): number {
  if (definitions.length === 0) return 100;
  const filled = definitions.length - missingProperties(frontmatter, definitions).length;
  return Math.round((filled / definitions.length) * 100);
}
