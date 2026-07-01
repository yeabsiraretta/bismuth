/**
 * Tests for claude.ts — Anthropic Messages API wrapper.
 * fetch and keychain are fully mocked; no network calls are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/services/system/keychain', () => ({
  getSecret: vi.fn(),
}));

import { getSecret } from '@/services/system/keychain';
import { sendClaudeMessage, sendClaudeMessageStream } from '../services/claude';
import type { AgentMessage } from '../types/llm';

const FAKE_KEY = 'sk-ant-test-abc123';
const MODEL = 'claude-sonnet-4-6';

const MESSAGES: AgentMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    createdAt: '2026-06-24T00:00:00Z',
  },
];

function mockFetchOk(body: unknown): void {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => body,
    text: async () => JSON.stringify(body),
    body: null,
  } as unknown as Response);
}

function mockFetchError(status: number): void {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => `HTTP Error ${status}`,
    body: null,
  } as unknown as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendClaudeMessage — missing key', () => {
  it('throws descriptive error when key not configured', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({ found: false, value: null, available: true });

    await expect(sendClaudeMessage(MESSAGES, MODEL)).rejects.toThrow(
      'Claude API key not configured — add via Settings > LLM',
    );
  });

  it('throws descriptive error when keychain unavailable', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({
      found: false,
      value: null,
      available: false,
      error: 'keychain locked',
    });

    await expect(sendClaudeMessage(MESSAGES, MODEL)).rejects.toThrow(
      'Claude API key not configured — add via Settings > LLM',
    );
  });
});

describe('sendClaudeMessage — successful request', () => {
  it('POSTs to correct Anthropic endpoint with x-api-key header', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({ found: true, value: FAKE_KEY, available: true });
    mockFetchOk({ content: [{ type: 'text', text: 'Hello there!' }] });

    await sendClaudeMessage(MESSAGES, MODEL);

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe(FAKE_KEY);
    expect(init.method).toBe('POST');
  });

  it('sends correct model and messages in body', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({ found: true, value: FAKE_KEY, available: true });
    mockFetchOk({ content: [{ type: 'text', text: 'Sure!' }] });

    await sendClaudeMessage(MESSAGES, MODEL);

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(MODEL);
    expect(body.max_tokens).toBe(4096);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0]).toEqual({ role: 'user', content: 'Hello' });
  });

  it('returns text from content[0].text', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({ found: true, value: FAKE_KEY, available: true });
    mockFetchOk({ content: [{ type: 'text', text: 'Parsed response.' }] });

    const result = await sendClaudeMessage(MESSAGES, MODEL);

    expect(result).toBe('Parsed response.');
  });

  it('returns empty string when content array is missing', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({ found: true, value: FAKE_KEY, available: true });
    mockFetchOk({});

    const result = await sendClaudeMessage(MESSAGES, MODEL);

    expect(result).toBe('');
  });
});

describe('sendClaudeMessage — API errors', () => {
  it('throws on non-OK HTTP response', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({ found: true, value: FAKE_KEY, available: true });
    mockFetchError(401);

    await expect(sendClaudeMessage(MESSAGES, MODEL)).rejects.toThrow('Claude API error: HTTP 401');
  });
});

describe('sendClaudeMessageStream — missing key', () => {
  it('throws descriptive error when key not configured', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({ found: false, value: null, available: true });

    await expect(sendClaudeMessageStream(MESSAGES, MODEL, vi.fn())).rejects.toThrow(
      'Claude API key not configured — add via Settings > LLM',
    );
  });
});

describe('sendClaudeMessageStream — streaming response', () => {
  it('calls onChunk with delta text and returns accumulated string', async () => {
    vi.mocked(getSecret).mockResolvedValueOnce({ found: true, value: FAKE_KEY, available: true });

    const sseLines = [
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}',
      'data: [DONE]',
    ].join('\n');

    const encoder = new TextEncoder();
    const encoded = encoder.encode(sseLines);
    let readCount = 0;

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockImplementation(async () => {
            if (readCount === 0) {
              readCount++;
              return { done: false, value: encoded };
            }
            return { done: true, value: undefined };
          }),
        }),
      },
    } as unknown as Response);

    const onChunk = vi.fn();
    const result = await sendClaudeMessageStream(MESSAGES, MODEL, onChunk);

    expect(onChunk).toHaveBeenCalledWith('Hello');
    expect(onChunk).toHaveBeenCalledWith(' world');
    expect(result).toBe('Hello world');
  });
});
