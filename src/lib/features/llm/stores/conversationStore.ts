/**
 * Conversation store — multi-tab conversation management with plan mode.
 * Each tab is an independent conversation with its own message history.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { ConversationTab, AgentMessage } from '../types/llm';

const MAX_TABS = 10;
const MAX_MESSAGES_PER_TAB = 100;

function generateId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateMsgId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createTab(title?: string): ConversationTab {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: title ?? 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
    planMode: false,
  };
}

/** All conversation tabs. */
export const conversationTabs = writable<ConversationTab[]>([createTab()]);

/** ID of the active tab. */
export const activeTabId = writable<string>('');

/** The active conversation tab (derived). */
export const activeConversation = derived(
  [conversationTabs, activeTabId],
  ([$tabs, $id]) => $tabs.find((t) => t.id === $id) ?? $tabs[0] ?? null
);

/** Messages of the active conversation (derived). */
export const activeMessages = derived(activeConversation, ($conv) => $conv?.messages ?? []);

/** Whether the active tab is in plan mode. */
export const isPlanMode = derived(activeConversation, ($conv) => $conv?.planMode ?? false);

// ─── Initialize ────────────────────────────────────────────────────────────

/** Ensure there's at least one tab and set the active tab. */
export function initConversations(): void {
  const tabs = get(conversationTabs);
  if (tabs.length === 0) {
    const tab = createTab();
    conversationTabs.set([tab]);
    activeTabId.set(tab.id);
  } else {
    const currentActive = get(activeTabId);
    if (!tabs.find((t) => t.id === currentActive)) {
      activeTabId.set(tabs[0].id);
    }
  }
}

// ─── Tab Management ────────────────────────────────────────────────────────

/** Create a new conversation tab and switch to it. */
export function newConversation(title?: string): string {
  const tab = createTab(title);
  conversationTabs.update((tabs) => {
    const next = [...tabs, tab];
    return next.length > MAX_TABS ? next.slice(1) : next;
  });
  activeTabId.set(tab.id);
  log.info('New conversation created', { id: tab.id, title: tab.title });
  return tab.id;
}

/** Switch to a conversation tab by ID. */
export function switchConversation(id: string): void {
  const tabs = get(conversationTabs);
  if (tabs.find((t) => t.id === id)) {
    activeTabId.set(id);
  }
}

/** Close a conversation tab. If it was the last one, create a fresh tab. */
export function closeConversation(id: string): void {
  conversationTabs.update((tabs) => {
    const next = tabs.filter((t) => t.id !== id);
    if (next.length === 0) {
      const fresh = createTab();
      activeTabId.set(fresh.id);
      return [fresh];
    }
    return next;
  });

  const current = get(activeTabId);
  if (current === id) {
    const tabs = get(conversationTabs);
    activeTabId.set(tabs[0]?.id ?? '');
  }
  log.info('Conversation closed', { id });
}

/** Rename a conversation tab. */
export function renameConversation(id: string, title: string): void {
  conversationTabs.update((tabs) => tabs.map((t) => (t.id === id ? { ...t, title } : t)));
}

/** Fork the active conversation into a new tab with a copy of current messages. */
export function forkConversation(): string {
  const conv = get(activeConversation);
  if (!conv) return newConversation();

  const now = new Date().toISOString();
  const forked: ConversationTab = {
    ...conv,
    id: generateId(),
    title: `${conv.title} (fork)`,
    messages: [...conv.messages],
    createdAt: now,
    updatedAt: now,
    forkedFrom: conv.id,
    planMode: conv.planMode,
  };

  conversationTabs.update((tabs) => [...tabs, forked]);
  activeTabId.set(forked.id);
  log.info('Conversation forked', { from: conv.id, to: forked.id });
  return forked.id;
}

// ─── Message Management ────────────────────────────────────────────────────

/** Add a message to the active conversation. */
export function addMessageToActive(msg: Omit<AgentMessage, 'id' | 'createdAt'>): AgentMessage {
  const full: AgentMessage = {
    ...msg,
    id: generateMsgId(),
    createdAt: new Date().toISOString(),
  };

  conversationTabs.update((tabs) =>
    tabs.map((t) => {
      if (t.id !== get(activeTabId)) return t;
      const msgs = [...t.messages, full];
      return {
        ...t,
        messages: msgs.length > MAX_MESSAGES_PER_TAB ? msgs.slice(-MAX_MESSAGES_PER_TAB) : msgs,
        updatedAt: new Date().toISOString(),
      };
    })
  );
  return full;
}

/** Update the last assistant message (for streaming). */
export function updateLastAssistantMessage(content: string): void {
  conversationTabs.update((tabs) =>
    tabs.map((t) => {
      if (t.id !== get(activeTabId)) return t;
      const msgs = [...t.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { ...t, messages: msgs };
    })
  );
}

/** Clear messages in the active conversation. */
export function clearActiveConversation(): void {
  conversationTabs.update((tabs) =>
    tabs.map((t) => (t.id === get(activeTabId) ? { ...t, messages: [] } : t))
  );
  log.info('Active conversation cleared');
}

// ─── Plan Mode ─────────────────────────────────────────────────────────────

/** Toggle plan mode for the active conversation. */
export function togglePlanMode(): void {
  conversationTabs.update((tabs) =>
    tabs.map((t) => (t.id === get(activeTabId) ? { ...t, planMode: !t.planMode } : t))
  );
}

/** Compact: summarize and collapse older messages (keep last 5). */
export function compactConversation(): void {
  conversationTabs.update((tabs) =>
    tabs.map((t) => {
      if (t.id !== get(activeTabId) || t.messages.length <= 5) return t;
      const kept = t.messages.slice(-5);
      const summary: AgentMessage = {
        id: generateMsgId(),
        role: 'system',
        content: `[Compacted: ${t.messages.length - 5} earlier messages summarized]`,
        createdAt: new Date().toISOString(),
      };
      return { ...t, messages: [summary, ...kept] };
    })
  );
  log.info('Conversation compacted');
}
