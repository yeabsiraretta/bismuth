import type { CanvasDocument } from '@/types/canvas';
import { exportToPNG, exportToSVG, downloadFile, downloadSVG, exportToJSON } from '@/utils/canvasExport';
import { log } from '@/utils/logger';

export type ExportFormat = 'PNG' | 'SVG' | 'JSON';

export async function saveCanvasWithLogging(saveCanvas: () => Promise<void>) {
  try {
    await saveCanvas();
    log.info('Canvas saved via keyboard shortcut');
  } catch (error) {
    log.error('Failed to save canvas', error as Error);
  }
}

export async function exportCanvas(canvas: CanvasDocument | null, format: ExportFormat) {
  if (!canvas) return;

  try {
    if (format === 'PNG') {
      const blob = await exportToPNG(canvas);
      downloadFile(blob, `${canvas.name}.png`);
      return;
    }

    if (format === 'SVG') {
      const svg = exportToSVG(canvas);
      downloadSVG(svg, `${canvas.name}.svg`);
      return;
    }

    const json = exportToJSON(canvas);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, `${canvas.name}.json`);
  } catch (error) {
    log.error(`Failed to export ${format}`, error as Error);
  }
}
