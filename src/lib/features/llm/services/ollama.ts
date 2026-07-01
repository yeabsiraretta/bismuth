/**
 * Ollama REST API wrappers — all fetch calls to Ollama are confined to this file.
 * Base URL is read from the llmConfig store (default: http://127.0.0.1:11434).
 */
import { get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { AgentMessage } from '../types/llm';
import { llmConfig } from '../stores/agentStore';

function getBaseUrl(): string {
  return get(llmConfig).ollamaUrl;
}

/**
 * Lists installed Ollama models. Returns empty array if Ollama is not running.
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/tags`);
    if (!response.ok) {
      log.error('Ollama /api/tags returned non-OK status', new Error(`HTTP ${response.status}`));
      return [];
    }
    const data = await response.json();
    const models = (data.models ?? []).map((m: { name: string }) => m.name);
    log.info('Ollama models loaded', { count: models.length });
    return models;
  } catch (err) {
    // Graceful degradation: Ollama not running
    log.error('Ollama not reachable — listModels returned empty', err as Error);
    return [];
  }
}

/**
 * Sends a non-streaming chat request to Ollama. Returns the full response text.
 */
export async function chatOllama(model: string, messages: AgentMessage[]): Promise<string> {
  const body = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: false,
  };

  const response = await fetch(`${getBaseUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ollama chat failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content ?? '';
}

/**
 * Streams a chat response from Ollama, yielding token chunks.
 */
export async function* chatOllamaStream(
  model: string,
  messages: AgentMessage[],
): AsyncGenerator<string> {
  const body = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
  };

  const response = await fetch(`${getBaseUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Ollama stream failed: HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        if (chunk.done) return;
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
      } catch {
        // Ignore partial JSON chunks
      }
    }
  }
}
