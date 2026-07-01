/**
 * Inline edit service — sends selected text + instruction to LLM,
 * returns a word-level diff for preview before applying.
 */

import { get } from 'svelte/store';
import { log } from '@/utils/logger';
import { llmConfig } from '../stores/agentStore';
import { sendClaudeMessage } from './claude';
import { chatOllama } from './ollama';
import type { AgentMessage, InlineEditRequest, InlineEditResult, DiffHunk } from '../types/llm';

const INLINE_EDIT_SYSTEM = `You are an inline text editor. The user will give you selected text and an instruction.
Return ONLY the edited replacement text — no explanations, no markdown fencing, no commentary.
Preserve the original formatting style (markdown, indentation, etc.) unless the instruction asks to change it.`;

/**
 * Execute an inline edit: send selected text + instruction to the LLM,
 * compute a word-level diff, and return the result.
 */
export async function performInlineEdit(request: InlineEditRequest): Promise<InlineEditResult> {
  const { selectedText, instruction } = request;
  log.info('Inline edit requested', { instruction, selectionLength: selectedText.length });

  const messages: AgentMessage[] = [
    { id: 'sys', role: 'system', content: INLINE_EDIT_SYSTEM, createdAt: '' },
    {
      id: 'user',
      role: 'user',
      content: `Selected text:\n\`\`\`\n${selectedText}\n\`\`\`\n\nInstruction: ${instruction}`,
      createdAt: '',
    },
  ];

  const config = get(llmConfig);
  let replacement: string;

  if (config.provider === 'claude') {
    replacement = await sendClaudeMessage(messages, config.model);
  } else {
    replacement = await chatOllama(config.model, messages);
  }

  // Strip any accidental markdown fencing
  replacement = stripCodeFence(replacement);

  const diffHunks = computeWordDiff(selectedText, replacement);

  log.info('Inline edit complete', {
    originalLength: selectedText.length,
    replacementLength: replacement.length,
    hunks: diffHunks.length,
  });

  return { replacement, diffHunks };
}

/** Strip leading/trailing code fences that models sometimes add. */
function stripCodeFence(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    const firstNewline = t.indexOf('\n');
    if (firstNewline > 0) t = t.slice(firstNewline + 1);
  }
  if (t.endsWith('```')) {
    t = t.slice(0, -3);
  }
  return t.trim();
}

/**
 * Compute a simple word-level diff between two strings.
 * Returns an array of DiffHunks for rendering.
 */
export function computeWordDiff(original: string, modified: string): DiffHunk[] {
  const origWords = tokenize(original);
  const modWords = tokenize(modified);
  const hunks: DiffHunk[] = [];

  // Simple LCS-based diff on word tokens
  const lcs = longestCommonSubsequence(origWords, modWords);

  let oi = 0;
  let mi = 0;
  let li = 0;

  while (oi < origWords.length || mi < modWords.length) {
    if (
      li < lcs.length &&
      oi < origWords.length &&
      mi < modWords.length &&
      origWords[oi] === lcs[li] &&
      modWords[mi] === lcs[li]
    ) {
      hunks.push({ type: 'equal', text: origWords[oi] });
      oi++;
      mi++;
      li++;
    } else if (li < lcs.length && oi < origWords.length && origWords[oi] !== lcs[li]) {
      hunks.push({ type: 'delete', text: origWords[oi] });
      oi++;
    } else if (li < lcs.length && mi < modWords.length && modWords[mi] !== lcs[li]) {
      hunks.push({ type: 'insert', text: modWords[mi] });
      mi++;
    } else if (oi < origWords.length) {
      hunks.push({ type: 'delete', text: origWords[oi] });
      oi++;
    } else if (mi < modWords.length) {
      hunks.push({ type: 'insert', text: modWords[mi] });
      mi++;
    } else {
      break;
    }
  }

  return mergeAdjacentHunks(hunks);
}

/** Tokenize text into words and whitespace. */
function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [];
}

/** LCS of two string arrays. */
function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: string[] = [];
  let i = m,
    j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return result;
}

/** Merge adjacent hunks of the same type into single hunks. */
function mergeAdjacentHunks(hunks: DiffHunk[]): DiffHunk[] {
  if (hunks.length === 0) return hunks;
  const merged: DiffHunk[] = [hunks[0]];
  for (let i = 1; i < hunks.length; i++) {
    const last = merged[merged.length - 1];
    if (hunks[i].type === last.type) {
      merged[merged.length - 1] = { type: last.type, text: last.text + hunks[i].text };
    } else {
      merged.push(hunks[i]);
    }
  }
  return merged;
}
