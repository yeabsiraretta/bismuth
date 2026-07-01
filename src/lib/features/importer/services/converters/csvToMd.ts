/**
 * CSV → Markdown converter.
 * Each row becomes a separate note. User picks which column is the title
 * and which is the body. Other columns become frontmatter fields.
 */

import type { ConvertedNote } from '../../types/importer';

/** Parse a CSV string into rows. Handles quoted fields. */
export function parseCsv(raw: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuote = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inQuote) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === delimiter) {
        current.push(field);
        field = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field);
        field = '';
        rows.push(current);
        current = [];
        if (ch === '\r') i++;
      } else {
        field += ch;
      }
    }
  }

  // Last field/row
  if (field || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows;
}

/** Detect delimiter: tab or comma. */
export function detectDelimiter(raw: string): string {
  const firstLine = raw.split('\n')[0] ?? '';
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? '\t' : ',';
}

/** Get column headers from first row. */
export function getHeaders(raw: string): string[] {
  const delimiter = detectDelimiter(raw);
  const rows = parseCsv(raw, delimiter);
  return rows[0] ?? [];
}

/**
 * Convert CSV to notes.
 * @param raw - CSV/TSV string content
 * @param titleColumn - Column name to use as note title (default: first column)
 * @param bodyColumn - Column name to use as note body (default: second column or empty)
 */
export function convertCsvToNotes(
  raw: string,
  titleColumn?: string,
  bodyColumn?: string
): ConvertedNote[] {
  const delimiter = detectDelimiter(raw);
  const rows = parseCsv(raw, delimiter);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const titleIdx = titleColumn ? headers.indexOf(titleColumn) : 0;
  const bodyIdx = bodyColumn ? headers.indexOf(bodyColumn) : headers.length > 1 ? 1 : -1;

  if (titleIdx === -1) return [];

  const notes: ConvertedNote[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell) => !cell.trim())) continue;

    const title = sanitizeTitle(row[titleIdx] ?? `Row ${r}`);
    const body = bodyIdx >= 0 ? (row[bodyIdx] ?? '') : '';

    // Build frontmatter from other columns
    const fmFields: string[] = [];
    for (let c = 0; c < headers.length; c++) {
      if (c === titleIdx || c === bodyIdx) continue;
      const key = headers[c].trim().toLowerCase().replace(/\s+/g, '_');
      const val = row[c]?.trim() ?? '';
      if (key && val) {
        fmFields.push(`${key}: "${val.replace(/"/g, '\\"')}"`);
      }
    }

    let content = '';
    if (fmFields.length > 0) {
      content += `---\n${fmFields.join('\n')}\n---\n\n`;
    }
    content += `# ${title}\n\n${body}\n`;

    notes.push({ title, content });
  }

  return notes;
}

function sanitizeTitle(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200) || 'Untitled'
  );
}
