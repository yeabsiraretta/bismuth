import { invokeCommand } from '@/ipc/invoke';
import { isTauriAvailable } from '@/utils/platform';

export type ImportSource = 'obsidian' | 'notion' | 'roam' | 'markdown' | 'evernote' | 'logseq';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function importNotes(source: ImportSource, sourcePath: string): Promise<ImportResult> {
  if (!isTauriAvailable()) {
    return Promise.resolve({ success: 0, failed: 0, errors: ['Import requires the desktop app'] });
  }
  return invokeCommand<ImportResult>('import_notes', { source, sourcePath });
}
