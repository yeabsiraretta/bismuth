/**
 * Claude API service — opt-in provider using the Anthropic Messages API.
 * Key is fetched from OS keychain each call; never stored in memory or localStorage.
 */
import { get } from 'svelte/store';
import { log } from '@/utils/logger';
import { getSecret } from '@/services/system/keychain';
import type { AgentMessage } from '../types/llm';
import { llmConfig } from '../stores/agentStore';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

function toAnthropicRole(role: AgentMessage['role']): 'user' | 'assistant' {
  return role === 'assistant' ? 'assistant' : 'user';
}

/**
 * Retrieves the Anthropic API key from the OS keychain.
 * Throws a user-facing error when the key is absent or the keychain is unavailable.
 */
async function requireApiKey(): Promise<string> {
  const result = await getSecret('anthropic-api-key');
  if (!result.available) {
    throw new Error('Claude API key not configured — add via Settings > LLM');
  }
  if (!result.found || !result.value) {
    throw new Error('Claude API key not configured — add via Settings > LLM');
  }
  return result.value;
}

/**
 * Sends a non-streaming chat request to the Anthropic Messages API.
 * Returns the full text of the first content block.
 */
export async function sendClaudeMessage(messages: AgentMessage[], model: string): Promise<string> {
  const apiKey = await requireApiKey();

  const maxTokens = get(llmConfig).maxTokens;
  const body = {
    model,
    max_tokens: maxTokens,
    messages: messages.map((m) => ({
      role: toAnthropicRole(m.role),
      content: m.content,
    })),
  };

  log.info('Claude: sending message', { model, maxTokens, messageCount: messages.length });

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => String(response.status));
    log.error('Claude API error', new Error(`HTTP ${response.status}: ${errText}`));
    throw new Error(`Claude API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  const text: string = data?.content?.[0]?.text ?? '';
  log.info('Claude: response received', { length: text.length });
  return text;
}

/**
 * Streams a chat response from the Anthropic Messages API.
 * Calls `onChunk` with each incremental text delta; returns the full accumulated text.
 */
export async function sendClaudeMessageStream(
  messages: AgentMessage[],
  model: string,
  onChunk: (text: string) => void
): Promise<string> {
  const apiKey = await requireApiKey();

  const maxTokens = get(llmConfig).maxTokens;
  const body = {
    model,
    max_tokens: maxTokens,
    stream: true,
    messages: messages.map((m) => ({
      role: toAnthropicRole(m.role),
      content: m.content,
    })),
  };

  log.info('Claude: starting stream', { model, maxTokens, messageCount: messages.length });

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => String(response.status));
    log.error('Claude stream error', new Error(`HTTP ${response.status}: ${errText}`));
    throw new Error(`Claude API stream error: HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const raw = decoder.decode(value, { stream: true });
    for (const line of raw.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') return accumulated;
      try {
        const event = JSON.parse(payload);
        const delta: string = event?.delta?.text ?? '';
        if (delta) {
          onChunk(delta);
          accumulated += delta;
        }
      } catch {
        // Ignore partial/non-JSON SSE lines
      }
    }
  }

  log.info('Claude: stream complete', { length: accumulated.length });
  return accumulated;
}
