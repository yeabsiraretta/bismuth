/**
 * Agent store — reactive state for the LLM agent panel.
 * Conversation history capped at 20 messages. Pending changes tracked here.
 */
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { log } from '@/utils/logger';
import type { AgentMessage, AgentProposedChange, LlmConfig } from '../types/llm';
import { ipcCall } from '@/utils/ipc';

const MAX_HISTORY = 20;

/** All messages in the current conversation (capped at MAX_HISTORY) */
export const conversationHistory: Writable<AgentMessage[]> = writable([]);

/** Pending agent proposed changes for the current vault */
export const pendingChanges: Writable<AgentProposedChange[]> = writable([]);

const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
const DEFAULT_MAX_TOKENS = 4096;

/** Active LLM provider and model configuration */
export const llmConfig: Writable<LlmConfig> = writable({
  provider: 'ollama',
  model: 'llama3.2',
  ollamaUrl: DEFAULT_OLLAMA_URL,
  maxTokens: DEFAULT_MAX_TOKENS,
  temperature: 0.7,
  openaiBaseUrl: 'https://api.openai.com/v1',
});

/** True while a chat response is in-progress */
export const isLoading: Writable<boolean> = writable(false);

/**
 * Appends a message to conversation history.
 * Prunes to MAX_HISTORY when the list exceeds that limit.
 */
export function addMessage(msg: AgentMessage): void {
  conversationHistory.update(history => {
    const next = [...history, msg];
    return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
  });
}

/** Clears the conversation history. */
export function clearHistory(): void {
  conversationHistory.set([]);
  log.info('Agent conversation history cleared');
}

/**
 * Loads pending proposed changes from the Rust backend for a vault.
 */
export async function loadPendingChanges(vaultRoot: string): Promise<void> {
  try {
    const changes = await ipcCall<AgentProposedChange[]>('list_proposed_changes', { vaultRoot });
    pendingChanges.set(changes);
    log.info('Pending changes loaded', { count: changes.length });
  } catch (err) {
    log.error('Failed to load pending changes', err as Error);
    pendingChanges.set([]);
  }
}

/**
 * Adds a proposed change to the local pending changes list.
 */
export function addProposedChange(change: AgentProposedChange): void {
  pendingChanges.update(changes => [...changes, change]);
}

/**
 * Approves a proposed change via IPC and removes it from the pending list.
 */
export async function approveChange(vaultRoot: string, changeId: string): Promise<void> {
  await ipcCall<void>('apply_change', { vaultRoot, changeId });
  pendingChanges.update(changes => changes.filter(c => c.changeId !== changeId));
  log.info('Change approved', { changeId });
}

/**
 * Rejects a proposed change via IPC and removes it from the pending list.
 */
export async function rejectChange(vaultRoot: string, changeId: string): Promise<void> {
  await ipcCall<void>('reject_change', { vaultRoot, changeId });
  pendingChanges.update(changes => changes.filter(c => c.changeId !== changeId));
  log.info('Change rejected', { changeId });
}

/** Sets the loading state for the agent panel. */
export function setLoading(value: boolean): void {
  isLoading.set(value);
}

/** Updates the active LLM provider, resetting the model to a default. */
export function setProvider(provider: LlmConfig['provider'], model?: string): void {
  llmConfig.update(c => ({ ...c, provider, model: model ?? c.model }));
  log.debug('LLM provider changed', { provider });
}

/** Updates the active model for the current provider. */
export function setModel(model: string): void {
  llmConfig.update(c => ({ ...c, model }));
  log.debug('LLM model changed', { model });
}

/** Updates the Ollama server base URL. */
export function setOllamaUrl(url: string): void {
  const normalized = url.replace(/\/+$/, '') || DEFAULT_OLLAMA_URL;
  llmConfig.update(c => ({ ...c, ollamaUrl: normalized }));
  log.debug('Ollama URL changed', { url: normalized });
}

/** Updates the max tokens for Claude API responses. */
export function setMaxTokens(tokens: number): void {
  const clamped = Math.max(256, Math.min(tokens, 128000));
  llmConfig.update(c => ({ ...c, maxTokens: clamped }));
  log.debug('LLM max tokens changed', { maxTokens: clamped });
}
