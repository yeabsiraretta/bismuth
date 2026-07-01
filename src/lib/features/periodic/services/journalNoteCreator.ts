/**
 * Journal note creation and period navigation.
 * Separated from journalService.ts for file-size compliance.
 */

import { invoke } from '@tauri-apps/api/core';
import { get } from 'svelte/store';
import { log } from '@/utils/logger';
import { currentVault } from '@/stores/vault/vault';
import type { JournalConfig, TemplateContext } from '../types';
import { resolveTemplateVars, formatDate } from './templateVars';
import {
  getPeriodBounds,
  computeIndex,
  resolveNotePath,
  buildFrontmatter,
} from './journalService';

interface CreateNoteResult {
  path: string;
  created: boolean;
}

/** Create a journal note on disk via Tauri IPC. */
export async function createJournalNote(
  date: Date,
  journal: JournalConfig,
  templateContent?: string,
): Promise<CreateNoteResult> {
  const vault = get(currentVault);
  if (!vault) throw new Error('No vault open');

  const path = resolveNotePath(date, journal);
  const frontmatter = buildFrontmatter(date, journal);
  const { start, end } = getPeriodBounds(date, journal);
  const index = computeIndex(date, journal);

  const ctx: TemplateContext = {
    date,
    startDate: start,
    endDate: end,
    journal,
    index,
    noteName: path.split('/').pop()?.replace('.md', '') ?? '',
  };

  let body = '';
  if (templateContent) {
    body = resolveTemplateVars(templateContent, ctx);
  }

  const content = `${frontmatter}\n${body}`;

  log.info('Journal: creating note', { path, journal: journal.name });

  try {
    return await invoke<CreateNoteResult>('create_journal_note', {
      vaultRoot: vault.root_path,
      notePath: path,
      content,
    });
  } catch (error) {
    log.error('Journal: note creation failed', error as Error, { path });

    // Fallback: try legacy IPC
    try {
      return await invoke<CreateNoteResult>('open_or_create_periodic_note', {
        vaultRoot: vault.root_path,
        periodType: journal.type === 'custom' ? 'daily' : journal.type,
        dateStr: formatDate(date, 'YYYY-MM-DD'),
      });
    } catch (fallbackError) {
      log.error('Journal: legacy fallback also failed', fallbackError as Error);
      throw new Error(`Failed to create journal note: ${error}`);
    }
  }
}

/** Navigate to the next or previous period for a journal. */
export function navigatePeriod(
  date: Date,
  journal: JournalConfig,
  direction: 'next' | 'prev',
): Date {
  const sign = direction === 'next' ? 1 : -1;
  const result = new Date(date);

  if (journal.type === 'custom' && journal.customInterval) {
    const { every, unit } = journal.customInterval;
    return advanceDate(result, every * sign, unit);
  }

  switch (journal.type) {
    case 'daily': result.setDate(result.getDate() + sign); break;
    case 'weekly': result.setDate(result.getDate() + 7 * sign); break;
    case 'monthly': result.setMonth(result.getMonth() + sign); break;
    case 'quarterly': result.setMonth(result.getMonth() + 3 * sign); break;
    case 'yearly': result.setFullYear(result.getFullYear() + sign); break;
  }

  return result;
}

function advanceDate(date: Date, amount: number, unit: string): Date {
  const result = new Date(date);
  switch (unit) {
    case 'day': result.setDate(result.getDate() + amount); break;
    case 'week': result.setDate(result.getDate() + amount * 7); break;
    case 'month': result.setMonth(result.getMonth() + amount); break;
  }
  return result;
}
