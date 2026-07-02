/**
 * Integration tests for agentStore.ts.
 * IPC and logger are fully mocked; no Tauri runtime required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/utils/ipc', () => ({
  ipcCall: vi.fn(),
}));

import { ipcCall } from '@/utils/ipc';
import {
  conversationHistory,
  pendingChanges,
  llmConfig,
  addMessage,
  clearHistory,
  addProposedChange,
  loadPendingChanges,
  setProvider,
  setModel,
  setOllamaUrl,
  setMaxTokens,
} from '../stores/agentStore';
import type { AgentMessage, AgentProposedChange } from '../types/llm';

function makeMsg(id: string): AgentMessage {
  return { id, role: 'user', content: `msg-${id}`, createdAt: '2026-06-24T00:00:00Z' };
}

function makeChange(changeId: string): AgentProposedChange {
  return {
    changeId,
    action: 'create',
    targetPath: `notes/${changeId}.md`,
    proposedContent: '# Test',
    createdAt: '2026-06-24T00:00:00Z',
    status: 'pending',
    agentName: 'test-agent',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  conversationHistory.set([]);
  pendingChanges.set([]);
  llmConfig.set({
    provider: 'ollama',
    model: 'llama3.2',
    ollamaUrl: 'http://127.0.0.1:11434',
    maxTokens: 4096,
    temperature: 0.7,
    openaiBaseUrl: 'https://api.openai.com/v1',
  });
});

describe('addMessage', () => {
  it('appends a message to conversation history', () => {
    addMessage(makeMsg('a'));
    expect(get(conversationHistory)).toHaveLength(1);
    expect(get(conversationHistory)[0].id).toBe('a');
  });

  it('appends multiple messages in order', () => {
    addMessage(makeMsg('a'));
    addMessage(makeMsg('b'));
    const history = get(conversationHistory);
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe('a');
    expect(history[1].id).toBe('b');
  });

  it('caps history at 20 messages', () => {
    for (let i = 0; i < 25; i++) {
      addMessage(makeMsg(String(i)));
    }
    const history = get(conversationHistory);
    expect(history).toHaveLength(20);
    // Oldest messages are pruned; most recent 20 remain
    expect(history[0].id).toBe('5');
    expect(history[19].id).toBe('24');
  });

  it('keeps exactly 20 when adding the 21st message', () => {
    for (let i = 0; i < 21; i++) {
      addMessage(makeMsg(String(i)));
    }
    expect(get(conversationHistory)).toHaveLength(20);
  });
});

describe('clearHistory', () => {
  it('empties conversation history', () => {
    addMessage(makeMsg('a'));
    addMessage(makeMsg('b'));
    clearHistory();
    expect(get(conversationHistory)).toHaveLength(0);
  });

  it('is a no-op on already-empty history', () => {
    clearHistory();
    expect(get(conversationHistory)).toHaveLength(0);
  });
});

describe('pendingChanges', () => {
  it('addProposedChange appends a change', () => {
    addProposedChange(makeChange('ch-1'));
    expect(get(pendingChanges)).toHaveLength(1);
    expect(get(pendingChanges)[0].changeId).toBe('ch-1');
  });

  it('addProposedChange accumulates multiple changes', () => {
    addProposedChange(makeChange('ch-1'));
    addProposedChange(makeChange('ch-2'));
    expect(get(pendingChanges)).toHaveLength(2);
  });

  it('loadPendingChanges sets changes from IPC', async () => {
    const changes = [makeChange('ch-3'), makeChange('ch-4')];
    vi.mocked(ipcCall).mockResolvedValueOnce(changes);
    await loadPendingChanges('/vault/root');
    expect(get(pendingChanges)).toHaveLength(2);
    expect(get(pendingChanges)[0].changeId).toBe('ch-3');
  });

  it('loadPendingChanges sets empty array on IPC error', async () => {
    vi.mocked(ipcCall).mockRejectedValueOnce(new Error('IPC failure'));
    addProposedChange(makeChange('ch-stale'));
    await loadPendingChanges('/vault/root');
    expect(get(pendingChanges)).toHaveLength(0);
  });
});

describe('llmConfig — setProvider', () => {
  it('setProvider updates provider field', () => {
    setProvider('claude');
    expect(get(llmConfig).provider).toBe('claude');
  });

  it('setProvider with explicit model updates model', () => {
    setProvider('claude', 'claude-opus-4');
    expect(get(llmConfig).provider).toBe('claude');
    expect(get(llmConfig).model).toBe('claude-opus-4');
  });

  it('setProvider without model preserves existing model', () => {
    llmConfig.set({
      provider: 'ollama',
      model: 'mistral',
      ollamaUrl: 'http://127.0.0.1:11434',
      maxTokens: 4096,
      temperature: 0.7,
      openaiBaseUrl: 'https://api.openai.com/v1',
    });
    setProvider('claude');
    expect(get(llmConfig).model).toBe('mistral');
  });
});

describe('llmConfig — setModel', () => {
  it('setModel updates only the model field', () => {
    setModel('llama3.1');
    expect(get(llmConfig).model).toBe('llama3.1');
    expect(get(llmConfig).provider).toBe('ollama');
  });

  it('setModel does not change the provider', () => {
    setProvider('claude', 'claude-sonnet-4-6');
    setModel('claude-opus-4');
    expect(get(llmConfig).provider).toBe('claude');
    expect(get(llmConfig).model).toBe('claude-opus-4');
  });
});

describe('llmConfig — setOllamaUrl', () => {
  it('updates the ollamaUrl field', () => {
    setOllamaUrl('http://192.168.1.100:11434');
    expect(get(llmConfig).ollamaUrl).toBe('http://192.168.1.100:11434');
  });

  it('strips trailing slashes', () => {
    setOllamaUrl('http://localhost:11434/');
    expect(get(llmConfig).ollamaUrl).toBe('http://localhost:11434');
  });

  it('falls back to default when empty string', () => {
    setOllamaUrl('');
    expect(get(llmConfig).ollamaUrl).toBe('http://127.0.0.1:11434');
  });
});

describe('llmConfig — setMaxTokens', () => {
  it('updates the maxTokens field', () => {
    setMaxTokens(8192);
    expect(get(llmConfig).maxTokens).toBe(8192);
  });

  it('clamps to minimum of 256', () => {
    setMaxTokens(10);
    expect(get(llmConfig).maxTokens).toBe(256);
  });

  it('clamps to maximum of 128000', () => {
    setMaxTokens(999999);
    expect(get(llmConfig).maxTokens).toBe(128000);
  });
});
