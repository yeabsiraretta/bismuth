/**
 * Comment Threads System (T139)
 *
 * Collaborative review comments attached to canvas elements or regions.
 * Supports threaded replies, resolution status, and mention tagging.
 */

import type { Point } from '@/types/canvas';

// ─── Comment Types ──────────────────────────────────────────────────────────

export type CommentStatus = 'open' | 'resolved' | 'wontfix';

/** A single comment message within a thread. */
export interface CommentMessage {
  id: string;
  author: string;
  text: string;
  created_at: number;
  edited_at?: number;
  /** @mentions extracted from text. */
  mentions: string[];
}

/** A comment thread anchored to a position or element. */
export interface CommentThread {
  id: string;
  /** Canvas this thread belongs to. */
  canvasId: string;
  /** Anchor position on the canvas (pin location). */
  position: Point;
  /** If attached to a specific element. */
  elementId?: string;
  /** Thread status. */
  status: CommentStatus;
  /** Ordered messages (first = original comment). */
  messages: CommentMessage[];
  /** Who created the thread. */
  author: string;
  created_at: number;
  resolved_at?: number;
  resolved_by?: string;
}

// ─── Comment Store Interface ────────────────────────────────────────────────

export interface CommentStore {
  threads: CommentThread[];
  /** Currently expanded thread ID (shown in sidebar). */
  activeThreadId: string | null;
  /** Filter settings. */
  filter: CommentFilter;
}

export interface CommentFilter {
  status: CommentStatus | 'all';
  author: string | 'all';
}

// ─── Factory Functions ──────────────────────────────────────────────────────

function generateId(): string {
  return `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function createThread(
  canvasId: string,
  position: Point,
  text: string,
  author: string,
  elementId?: string
): CommentThread {
  return {
    id: generateId(),
    canvasId,
    position,
    elementId,
    status: 'open',
    messages: [createMessage(text, author)],
    author,
    created_at: Math.floor(Date.now() / 1000),
  };
}

export function createMessage(text: string, author: string): CommentMessage {
  return {
    id: generateId(),
    author,
    text,
    created_at: Math.floor(Date.now() / 1000),
    mentions: extractMentions(text),
  };
}

// ─── Thread Operations ──────────────────────────────────────────────────────

export function addReply(
  thread: CommentThread,
  text: string,
  author: string
): CommentThread {
  return {
    ...thread,
    messages: [...thread.messages, createMessage(text, author)],
  };
}

export function resolveThread(
  thread: CommentThread,
  resolvedBy: string
): CommentThread {
  return {
    ...thread,
    status: 'resolved',
    resolved_at: Math.floor(Date.now() / 1000),
    resolved_by: resolvedBy,
  };
}

export function reopenThread(thread: CommentThread): CommentThread {
  return {
    ...thread,
    status: 'open',
    resolved_at: undefined,
    resolved_by: undefined,
  };
}

// ─── Filtering & Queries ────────────────────────────────────────────────────

export function filterThreads(
  threads: CommentThread[],
  filter: CommentFilter
): CommentThread[] {
  return threads.filter((thread) => {
    if (filter.status !== 'all' && thread.status !== filter.status) return false;
    if (filter.author !== 'all' && thread.author !== filter.author) return false;
    return true;
  });
}

export function getThreadsForElement(
  threads: CommentThread[],
  elementId: string
): CommentThread[] {
  return threads.filter((t) => t.elementId === elementId);
}

export function getOpenThreadCount(threads: CommentThread[]): number {
  return threads.filter((t) => t.status === 'open').length;
}

/** Returns all unique authors across all threads. */
export function getAuthors(threads: CommentThread[]): string[] {
  const authors = new Set<string>();
  for (const thread of threads) {
    authors.add(thread.author);
    for (const msg of thread.messages) {
      authors.add(msg.author);
    }
  }
  return Array.from(authors).sort();
}

// ─── Mention Parsing ────────────────────────────────────────────────────────

/** Extracts @mentions from comment text. */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w.-]+/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}

/** Returns threads where a specific user is mentioned. */
export function getMentionsForUser(
  threads: CommentThread[],
  username: string
): CommentThread[] {
  return threads.filter((t) =>
    t.messages.some((m) => m.mentions.includes(username))
  );
}
