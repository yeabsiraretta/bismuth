import { describe, expect, it } from 'vitest';

import type { McpToolResult } from '@/ipc/api-client';
import {
  buildAgentSystemPrompt,
  formatToolResult,
  getHelpText,
  parseTerminalInput,
  parseToolCalls,
  stripToolCalls,
} from '@/sal/ai-agent-service';

// ── parseToolCalls ──────────────────────────────────────────────────────────

describe('parseToolCalls', () => {
  it('parses a single <tool_call> block', () => {
    const text =
      'Let me search for that.\n<tool_call>\n{"name": "search_vault", "arguments": {"query": "react"}}\n</tool_call>';
    const calls = parseToolCalls(text);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('search_vault');
    expect(calls[0].arguments).toEqual({ query: 'react' });
  });

  it('parses multiple <tool_call> blocks', () => {
    const text = `
<tool_call>{"name": "list_notes", "arguments": {}}</tool_call>
Some text in between.
<tool_call>{"name": "read_note", "arguments": {"path": "test.md"}}</tool_call>
`;
    const calls = parseToolCalls(text);
    expect(calls).toHaveLength(2);
    expect(calls[0].name).toBe('list_notes');
    expect(calls[1].name).toBe('read_note');
    expect(calls[1].arguments).toEqual({ path: 'test.md' });
  });

  it('parses tool call from JSON code block when no <tool_call> present', () => {
    const text =
      'I will search for that.\n```json\n{"name": "search_vault", "arguments": {"query": "react"}}\n```';
    const calls = parseToolCalls(text);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('search_vault');
  });

  it('ignores JSON code blocks that lack name+arguments', () => {
    const text = '```json\n{"key": "value"}\n```';
    const calls = parseToolCalls(text);
    expect(calls).toHaveLength(0);
  });

  it('returns empty array for text without tool calls', () => {
    const text = 'Just some regular text without any tool calls.';
    const calls = parseToolCalls(text);
    expect(calls).toHaveLength(0);
  });

  it('handles malformed JSON gracefully', () => {
    const text = '<tool_call>\n{invalid json}\n</tool_call>';
    const calls = parseToolCalls(text);
    expect(calls).toHaveLength(0);
  });

  it('defaults arguments to empty object if missing', () => {
    const text = '<tool_call>\n{"name": "vault_stats"}\n</tool_call>';
    const calls = parseToolCalls(text);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('vault_stats');
    expect(calls[0].arguments).toEqual({});
  });

  it('prefers <tool_call> blocks over JSON code blocks', () => {
    const text = `
<tool_call>{"name": "list_notes", "arguments": {}}</tool_call>
\`\`\`json
{"name": "read_note", "arguments": {"path": "x.md"}}
\`\`\`
`;
    const calls = parseToolCalls(text);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('list_notes');
  });
});

// ── stripToolCalls ──────────────────────────────────────────────────────────

describe('stripToolCalls', () => {
  it('removes <tool_call> blocks', () => {
    const text = 'Before\n<tool_call>\n{"name": "foo", "arguments": {}}\n</tool_call>\nAfter';
    expect(stripToolCalls(text)).toBe('Before\n\nAfter');
  });

  it('removes JSON code blocks that are tool calls', () => {
    const text = 'Before\n```json\n{"name": "bar", "arguments": {"x": 1}}\n```\nAfter';
    expect(stripToolCalls(text)).toBe('Before\n\nAfter');
  });

  it('preserves non-tool-call JSON code blocks', () => {
    const text = 'Here is config:\n```json\n{"key": "value"}\n```\nEnd';
    expect(stripToolCalls(text)).toBe('Here is config:\n```json\n{"key": "value"}\n```\nEnd');
  });

  it('handles text with no tool calls', () => {
    const text = 'Just regular text.';
    expect(stripToolCalls(text)).toBe('Just regular text.');
  });

  it('strips multiple tool calls', () => {
    const text =
      '<tool_call>{"name":"a","arguments":{}}</tool_call>x<tool_call>{"name":"b","arguments":{}}</tool_call>';
    const result = stripToolCalls(text);
    expect(result).toBe('x');
  });
});

// ── buildAgentSystemPrompt ──────────────────────────────────────────────────

describe('buildAgentSystemPrompt', () => {
  it('includes tool names and descriptions', () => {
    const tools = [
      { name: 'list_notes', description: 'List all notes' },
      { name: 'read_note', description: 'Read a note' },
    ];
    const prompt = buildAgentSystemPrompt(tools);
    expect(prompt).toContain('list_notes');
    expect(prompt).toContain('List all notes');
    expect(prompt).toContain('read_note');
    expect(prompt).toContain('Read a note');
  });

  it('includes the <tool_call> format instruction', () => {
    const prompt = buildAgentSystemPrompt([]);
    expect(prompt).toContain('<tool_call>');
    expect(prompt).toContain('</tool_call>');
  });

  it('includes guidelines section', () => {
    const prompt = buildAgentSystemPrompt([]);
    expect(prompt).toContain('## Guidelines');
  });

  it('handles empty tools list', () => {
    const prompt = buildAgentSystemPrompt([]);
    expect(prompt).toContain('## Available Tools');
    expect(prompt.length).toBeGreaterThan(100);
  });
});

// ── formatToolResult ────────────────────────────────────────────────────────

describe('formatToolResult', () => {
  it('formats text content', () => {
    const result: McpToolResult = {
      content: [{ type: 'text', text: 'Hello world' }],
      isError: false,
    };
    expect(formatToolResult(result)).toBe('Hello world');
  });

  it('joins multiple content items', () => {
    const result: McpToolResult = {
      content: [
        { type: 'text', text: 'Line 1' },
        { type: 'text', text: 'Line 2' },
      ],
      isError: false,
    };
    expect(formatToolResult(result)).toBe('Line 1\nLine 2');
  });

  it('prefixes error results', () => {
    const result: McpToolResult = {
      content: [{ type: 'text', text: 'Not found' }],
      isError: true,
    };
    expect(formatToolResult(result)).toBe('[Tool Error] Not found');
  });

  it('truncates very large results', () => {
    const bigText = 'x'.repeat(10000);
    const result: McpToolResult = {
      content: [{ type: 'text', text: bigText }],
      isError: false,
    };
    const formatted = formatToolResult(result);
    expect(formatted.length).toBeLessThan(bigText.length);
    expect(formatted).toContain('truncated');
    expect(formatted).toContain('10000');
  });

  it('does not truncate results under 8000 chars', () => {
    const text = 'y'.repeat(7999);
    const result: McpToolResult = {
      content: [{ type: 'text', text }],
      isError: false,
    };
    expect(formatToolResult(result)).toBe(text);
  });
});

// ── parseTerminalInput ──────────────────────────────────────────────────────

describe('parseTerminalInput', () => {
  it('parses /help', () => {
    expect(parseTerminalInput('/help')).toEqual({ type: 'help' });
  });

  it('parses ? as help', () => {
    expect(parseTerminalInput('?')).toEqual({ type: 'help' });
  });

  it('parses /tools', () => {
    expect(parseTerminalInput('/tools')).toEqual({ type: 'tools' });
  });

  it('parses /list as tools', () => {
    expect(parseTerminalInput('/list')).toEqual({ type: 'tools' });
  });

  it('parses /clear', () => {
    expect(parseTerminalInput('/clear')).toEqual({ type: 'clear' });
  });

  it('parses /tool_name with JSON args', () => {
    const result = parseTerminalInput('/search_vault {"query": "react"}');
    expect(result.type).toBe('tool');
    expect(result.toolName).toBe('search_vault');
    expect(result.toolArgs).toEqual({ query: 'react' });
  });

  it('parses /tool_name with no args', () => {
    const result = parseTerminalInput('/vault_stats');
    expect(result.type).toBe('tool');
    expect(result.toolName).toBe('vault_stats');
    expect(result.toolArgs).toEqual({});
  });

  it('parses /tool_name with non-JSON text as query arg', () => {
    const result = parseTerminalInput('/search_vault my search text');
    expect(result.type).toBe('tool');
    expect(result.toolName).toBe('search_vault');
    expect(result.toolArgs).toEqual({ query: 'my search text' });
  });

  it('parses plain text as chat', () => {
    const result = parseTerminalInput('What notes do I have about React?');
    expect(result.type).toBe('chat');
    expect(result.text).toBe('What notes do I have about React?');
  });

  it('trims whitespace', () => {
    expect(parseTerminalInput('  /help  ')).toEqual({ type: 'help' });
  });

  it('handles multiline chat input', () => {
    const result = parseTerminalInput('Line 1\nLine 2\nLine 3');
    expect(result.type).toBe('chat');
    expect(result.text).toContain('Line 1');
    expect(result.text).toContain('Line 3');
  });
});

// ── getHelpText ─────────────────────────────────────────────────────────────

describe('getHelpText', () => {
  it('returns non-empty markdown string', () => {
    const help = getHelpText();
    expect(help.length).toBeGreaterThan(50);
    expect(help).toContain('/tools');
    expect(help).toContain('/help');
    expect(help).toContain('/clear');
  });

  it('mentions tool invocation syntax', () => {
    const help = getHelpText();
    expect(help).toContain('/tool_name');
  });
});
