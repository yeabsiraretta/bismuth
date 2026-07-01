/**
 * RAG Store — manages config, conversation state, and the
 * RAG query pipeline: retrieve context → build prompt → call LLM.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { RagConfig, RagMessage, RagCitation } from '../types';
import { DEFAULT_RAG_CONFIG } from '../types';
import { retrieveContext } from '../services/ragRetriever';
import { buildRagMessages, formatCitationFooter } from '../services/ragPrompt';

const CONFIG_KEY = 'bismuth:rag-config';
const MAX_MESSAGES = 50;

function loadConfig(): RagConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_RAG_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_RAG_CONFIG };
}

function saveConfig(cfg: RagConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    log.warn('ragStore: failed to persist config');
  }
}

function generateId(): string {
  return `rag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Stores ─────────────────────────────────────────────────────────────────

const configInternal = writable<RagConfig>(loadConfig());
const messagesInternal = writable<RagMessage[]>([]);
const loadingInternal = writable(false);
const lastCitationsInternal = writable<RagCitation[]>([]);

export const ragConfig = derived(configInternal, $c => $c);
export const ragMessages = derived(messagesInternal, $m => $m);
export const ragLoading = derived(loadingInternal, $l => $l);
export const ragCitations = derived(lastCitationsInternal, $c => $c);

// ─── Config ─────────────────────────────────────────────────────────────────

export function updateRagConfig(patch: Partial<RagConfig>): void {
  configInternal.update(c => {
    const next = { ...c, ...patch };
    saveConfig(next);
    return next;
  });
}

export function resetRagConfig(): void {
  configInternal.set({ ...DEFAULT_RAG_CONFIG });
  saveConfig(DEFAULT_RAG_CONFIG);
}

// ─── Messages ───────────────────────────────────────────────────────────────

export function clearRagMessages(): void {
  messagesInternal.set([]);
  lastCitationsInternal.set([]);
}

function addMessage(msg: Omit<RagMessage, 'id' | 'createdAt'>): RagMessage {
  const full: RagMessage = {
    ...msg,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  messagesInternal.update(msgs => {
    const next = [...msgs, full];
    return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
  });
  return full;
}

function updateLastAssistant(content: string, citations?: RagCitation[]): void {
  messagesInternal.update(msgs => {
    const updated = [...msgs];
    for (let i = updated.length - 1; i >= 0; i--) {
      if (updated[i].role === 'assistant') {
        updated[i] = { ...updated[i], content, citations };
        break;
      }
    }
    return updated;
  });
}

// ─── RAG Query Pipeline ─────────────────────────────────────────────────────

/**
 * Execute a RAG query: retrieve → prompt → LLM → respond with citations.
 */
export async function askRag(query: string): Promise<void> {
  const config = get(configInternal);
  loadingInternal.set(true);

  addMessage({ role: 'user', content: query });
  addMessage({ role: 'assistant', content: 'Searching vault...' });

  try {
    // 1. Retrieve context
    const context = await retrieveContext(query, config);
    lastCitationsInternal.set(context.citations);

    updateLastAssistant(
      `Found ${context.citations.length} source(s). Generating answer...`,
      context.citations,
    );

    // 2. Build messages
    const history = get(messagesInternal)
      .filter(m => m.role !== 'system')
      .slice(0, -1)
      .map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: m.createdAt,
      }));
    const llmMessages = buildRagMessages(query, context, config, history);

    // 3. Call LLM (use configured provider)
    const { llmConfig } = await import('@/features/llm/stores/agentStore');
    const llmCfg = get(llmConfig);

    let response = '';

    if (llmCfg.provider === 'ollama') {
      const { chatOllamaStream } = await import('@/features/llm/services/ollama');
      for await (const chunk of chatOllamaStream(llmCfg.model, llmMessages)) {
        response += chunk;
        updateLastAssistant(response, context.citations);
      }
    } else if (llmCfg.provider === 'claude') {
      const { sendClaudeMessage } = await import('@/features/llm/services/claude');
      response = await sendClaudeMessage(llmMessages, llmCfg.model);
    } else {
      response = 'No LLM provider configured. Set one in Settings.';
    }

    // 4. Append citation footer if enabled
    if (config.showCitations && context.citations.length > 0) {
      response += formatCitationFooter(context);
    }

    updateLastAssistant(response, context.citations);
    log.info('ragStore: query completed', {
      query: query.slice(0, 50),
      citations: context.citations.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    updateLastAssistant(`Error: ${msg}`);
    log.error('ragStore: query failed', new Error(msg));
  } finally {
    loadingInternal.set(false);
  }
}
