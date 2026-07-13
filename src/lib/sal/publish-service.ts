import { invokeCommand } from '@/ipc/invoke';
import { isTauriAvailable } from '@/utils/platform';

export type ExportFormat = 'html' | 'markdown' | 'pdf';

export interface PublishResult {
  exported: number;
  failed: number;
  outputPath: string;
  errors: string[];
}

export function publishNotes(
  format: ExportFormat,
  notePaths: string[],
  outputDir?: string
): Promise<PublishResult> {
  if (!isTauriAvailable()) {
    return Promise.resolve({
      exported: 0,
      failed: 0,
      outputPath: '',
      errors: ['Publish requires the desktop app'],
    });
  }
  return invokeCommand<PublishResult>('publish_notes', { format, notePaths, outputDir });
}
