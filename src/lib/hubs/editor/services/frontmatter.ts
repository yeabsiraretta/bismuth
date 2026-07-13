const FM_REGEX = /^---\r?\n([\s\S]*?)\r?\n---/;

export interface FrontmatterResult {
  data: Record<string, unknown>;
  content: string;
  raw: string;
}

export function parseFrontmatter(source: string): FrontmatterResult {
  const match = source.match(FM_REGEX);
  if (!match) {
    return { data: {}, content: source, raw: '' };
  }

  const raw = match[1];
  const content = source.slice(match[0].length).replace(/^\r?\n/, '');
  const data = parseYamlLike(raw);

  return { data, content, raw };
}

function hasFrontmatter(source: string): boolean {
  return FM_REGEX.test(source);
}

function stripFrontmatter(source: string): string {
  return source.replace(FM_REGEX, '').replace(/^\r?\n/, '');
}

function serializeFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${String(item)}`);
      }
    } else {
      lines.push(`${key}: ${formatValue(value)}`);
    }
  }
  return `---\n${lines.join('\n')}\n---`;
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    if (value.includes(':') || value.includes('#') || value.includes("'")) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(value);
}

function parseYamlLike(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split('\n');
  let currentKey = '';
  let currentArray: unknown[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const arrayMatch = trimmed.match(/^-\s+(.+)/);
    if (arrayMatch && currentArray !== null) {
      currentArray.push(parseScalar(arrayMatch[1]));
      continue;
    }

    if (currentArray !== null) {
      result[currentKey] = currentArray;
      currentArray = null;
    }

    const kvMatch = trimmed.match(/^([^:]+?):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      if (value === '') {
        currentArray = [];
      } else {
        result[currentKey] = parseScalar(value);
      }
    }
  }

  if (currentArray !== null) {
    result[currentKey] = currentArray;
  }

  return result;
}

function parseScalar(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return '';

  const stripped =
    (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
      ? value.slice(1, -1)
      : value;

  const num = Number(stripped);
  if (!isNaN(num) && stripped !== '') return num;

  return stripped;
}
