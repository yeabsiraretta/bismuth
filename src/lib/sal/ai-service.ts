import { getLlm } from '@/hubs/core/stores/settings-store.svelte';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

function buildHeaders(apiKey: string, provider: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

function buildBody(messages: ChatMessage[], model: string, provider: string): string {
  if (provider === 'anthropic') {
    const system = messages.find((m) => m.role === 'system')?.content;
    const filtered = messages.filter((m) => m.role !== 'system');
    return JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      ...(system ? { system } : {}),
      messages: filtered.map((m) => ({ role: m.role, content: m.content })),
    });
  }

  // OpenAI-compatible (OpenAI, Ollama, custom)
  return JSON.stringify({
    model,
    stream: true,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
}

function chatEndpoint(baseUrl: string, provider: string): string {
  const url = baseUrl.replace(/\/$/, '');
  if (provider === 'anthropic') return `${url}/messages`;
  return `${url}/chat/completions`;
}

export function isConfigured(): boolean {
  const llm = getLlm();
  if (!llm.llmEnabled) return false;
  if (llm.llmProvider === 'ollama') return !!llm.llmApiUrl;
  return !!llm.llmApiKey && !!llm.llmApiUrl;
}

export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  const llm = getLlm();

  if (!llm.llmEnabled) {
    callbacks.onError('AI is disabled. Enable it in Settings → AI.');
    return;
  }

  if (!isConfigured()) {
    callbacks.onError('AI not configured. Add your API key in Settings → AI.');
    return;
  }

  const endpoint = chatEndpoint(llm.llmApiUrl, llm.llmProvider);
  const headers = buildHeaders(llm.llmApiKey, llm.llmProvider);
  const body = buildBody(messages, llm.llmModel, llm.llmProvider);

  try {
    const response = await fetch(endpoint, { method: 'POST', headers, body });

    if (!response.ok) {
      const text = await response.text();
      callbacks.onError(`API error ${response.status}: ${text.slice(0, 200)}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('No response stream available');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const token = extractToken(json, llm.llmProvider);
          if (token) callbacks.onToken(token);
        } catch {
          // Incomplete JSON chunk — skip
        }
      }
    }

    callbacks.onDone();
  } catch (e) {
    callbacks.onError(`Network error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function extractToken(json: Record<string, unknown>, provider: string): string | null {
  if (provider === 'anthropic') {
    if (json['type'] === 'content_block_delta') {
      const delta = json['delta'] as Record<string, unknown> | undefined;
      return (delta?.['text'] as string) ?? null;
    }
    return null;
  }

  // OpenAI-compatible
  const choices = json['choices'] as Array<Record<string, unknown>> | undefined;
  if (!choices?.length) return null;
  const delta = choices[0]?.['delta'] as Record<string, unknown> | undefined;
  return (delta?.['content'] as string) ?? null;
}
