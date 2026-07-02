/**
 * ABC notation parser — extracts notation content and optional JSON options
 * from ```abc fenced code blocks.
 *
 * Supports the Obsidian ABC.JS plugin format:
 *   - Plain ABC notation
 *   - JSON options header separated by `---`
 *
 * Example with options:
 *   ```abc
 *   {"tablature": [{"instrument": "violin"}]}
 *   ---
 *   X:1
 *   T: My Tune
 *   ...
 *   ```
 */

export interface AbcBlock {
  /** Document offset of the code block start (```) */
  from: number;
  /** Document offset of the code block end (```) */
  to: number;
  /** The raw ABC notation text (without JSON header). */
  notation: string;
  /** Parsed abcjs renderAbc options from the JSON header, if any. */
  options: Record<string, unknown>;
  /** Error message if JSON header was malformed. */
  optionsError?: string;
}

/**
 * Parse an abc code block body (the content between ``` fences).
 * Splits out an optional JSON header delimited by `---`.
 */
export function parseAbcBlockContent(body: string): {
  notation: string;
  options: Record<string, unknown>;
  optionsError?: string;
} {
  const separatorIndex = body.indexOf('\n---\n');
  const separatorAltIndex = body.indexOf('\n---');

  // Check for JSON header: first line must start with `{`
  const firstLine = body.split('\n')[0].trim();
  if (!firstLine.startsWith('{')) {
    return { notation: body, options: {} };
  }

  // Find the --- separator
  let headerEnd: number;
  let bodyStart: number;

  if (separatorIndex !== -1) {
    headerEnd = separatorIndex;
    bodyStart = separatorIndex + 5; // skip '\n---\n'
  } else if (separatorAltIndex !== -1 && separatorAltIndex === body.indexOf('\n---')) {
    headerEnd = separatorAltIndex;
    bodyStart = separatorAltIndex + 4; // skip '\n---'
    // Handle case where --- is at end of content
    if (bodyStart < body.length && body[bodyStart] === '\n') bodyStart++;
  } else {
    // No separator found — treat entire block as notation
    return { notation: body, options: {} };
  }

  const jsonStr = body.slice(0, headerEnd).trim();
  const notation = body.slice(bodyStart);

  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { notation, options: {}, optionsError: 'Options must be a JSON object' };
    }
    return { notation, options: parsed as Record<string, unknown> };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { notation, options: {}, optionsError: `Invalid JSON: ${msg}` };
  }
}

/**
 * Find all ```abc ... ``` fenced code blocks in a document string.
 */
export function findAbcBlocks(text: string): AbcBlock[] {
  const blocks: AbcBlock[] = [];
  const regex = /^```abc\s*\n([\s\S]*?)^```/gm;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const body = match[1];
    const parsed = parseAbcBlockContent(body);

    blocks.push({
      from: match.index,
      to: match.index + match[0].length,
      notation: parsed.notation,
      options: parsed.options,
      optionsError: parsed.optionsError,
    });
  }

  return blocks;
}

/**
 * Generate a sample ABC notation block for insertion.
 */
export function sampleAbcBlock(): string {
  return `\`\`\`abc
X:1
T:Sample Tune
M:4/4
L:1/8
K:C
CDEF GABc | cBAG FEDC |
CDEF GABc | cBAG FEDC |]
\`\`\``;
}
