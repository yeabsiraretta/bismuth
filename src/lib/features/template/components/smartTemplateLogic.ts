/**
 * SmartTemplateModal logic — extracted for 300-line compliance.
 * Handles prompt building, clipboard copy, and step management.
 */

import type { SmartTemplate, PromptContext, BuiltPrompt } from '../types/smartTemplate';
import {
  buildCurrentContext,
  buildSmartPrompt,
  addRecentPrompt,
  refreshSmartTemplates,
} from '../stores/smartTemplateStore';
import { log } from '@/utils/logger';

export type ModalStep = 'context' | 'templates' | 'instructions' | 'result';

export const STEP_ORDER: ModalStep[] = ['context', 'templates', 'instructions', 'result'];

export function getStepIndex(step: ModalStep): number {
  return STEP_ORDER.indexOf(step);
}

export function canGoNext(step: ModalStep): boolean {
  return getStepIndex(step) < STEP_ORDER.length - 1;
}

export function canGoBack(step: ModalStep): boolean {
  return getStepIndex(step) > 0;
}

export function nextStep(step: ModalStep): ModalStep {
  const idx = getStepIndex(step);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : step;
}

export function prevStep(step: ModalStep): ModalStep {
  const idx = getStepIndex(step);
  return idx > 0 ? STEP_ORDER[idx - 1] : step;
}

/** Initialize context from the active note + optional selection. */
export function initContext(selection?: string): PromptContext | null {
  return buildCurrentContext(selection);
}

/** Build the final prompt. */
export function assemblePrompt(
  context: PromptContext,
  selectedTemplates: SmartTemplate[],
  instructions: string,
): BuiltPrompt {
  const prompt = buildSmartPrompt(context, selectedTemplates, instructions);
  addRecentPrompt(prompt);
  return prompt;
}

/** Copy text to clipboard. Returns true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    log.info('Smart Templates: prompt copied to clipboard');
    return true;
  } catch (err) {
    log.error('Smart Templates: clipboard copy failed', err as Error);
    return false;
  }
}

/** Toggle template selection. */
export function toggleTemplateSelection(
  selected: SmartTemplate[],
  template: SmartTemplate,
): SmartTemplate[] {
  const idx = selected.findIndex(t => t.name === template.name);
  if (idx >= 0) {
    return [...selected.slice(0, idx), ...selected.slice(idx + 1)];
  }
  return [...selected, template];
}

/** Initialize the modal (refresh templates). */
export async function initModal(): Promise<void> {
  await refreshSmartTemplates();
}
