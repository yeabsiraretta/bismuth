import { describe, it, expect } from 'vitest';
import { buildRagSystemPrompt, buildRagMessages, formatCitationFooter } from '../services/ragPrompt';
import type { RagContext, RagCitation } from '../types';
import { DEFAULT_RAG_CONFIG } from '../types';

function makeCitation(index: number, overrides?: Partial<RagCitation>): RagCitation {
  return {
    index,
    notePath: `/notes/note-${index}.md`,
    noteTitle: `Note ${index}`,
    excerpt: `Excerpt for note ${index}`,
    score: 0.9 - index * 0.1,
    source: 'vector',
    ...overrides,
  };
}

function makeContext(citationCount: number): RagContext {
  const citations = Array.from({ length: citationCount }, (_, i) => makeCitation(i + 1));
  const contextText = citations.map(c => `[${c.index}] ${c.noteTitle}:\n${c.excerpt}`).join('\n\n');
  return { citations, contextText, tokenEstimate: contextText.length / 4 };
}

describe('buildRagSystemPrompt', () => {
  it('includes context when citations exist', () => {
    const ctx = makeContext(2);
    const prompt = buildRagSystemPrompt(ctx, DEFAULT_RAG_CONFIG);
    expect(prompt).toContain('CONTEXT FROM VAULT');
    expect(prompt).toContain('Note 1');
    expect(prompt).toContain('Note 2');
    expect(prompt).toContain('2 source(s)');
  });

  it('notes when no context found', () => {
    const ctx: RagContext = { citations: [], contextText: '', tokenEstimate: 0 };
    const prompt = buildRagSystemPrompt(ctx, DEFAULT_RAG_CONFIG);
    expect(prompt).toContain('No relevant context was found');
  });

  it('includes citation instruction', () => {
    const ctx = makeContext(1);
    const prompt = buildRagSystemPrompt(ctx, DEFAULT_RAG_CONFIG);
    expect(prompt).toContain('[1]');
  });
});

describe('buildRagMessages', () => {
  it('returns system + user messages', () => {
    const ctx = makeContext(1);
    const msgs = buildRagMessages('test query', ctx, DEFAULT_RAG_CONFIG);
    expect(msgs[0].role).toBe('system');
    expect(msgs[msgs.length - 1].role).toBe('user');
    expect(msgs[msgs.length - 1].content).toBe('test query');
  });

  it('includes history between system and user', () => {
    const ctx = makeContext(1);
    const history = [
      { id: '1', role: 'user' as const, content: 'prev', createdAt: '' },
      { id: '2', role: 'assistant' as const, content: 'answer', createdAt: '' },
    ];
    const msgs = buildRagMessages('new q', ctx, DEFAULT_RAG_CONFIG, history);
    expect(msgs.length).toBe(4);
    expect(msgs[1].content).toBe('prev');
    expect(msgs[2].content).toBe('answer');
    expect(msgs[3].content).toBe('new q');
  });

  it('limits history to last 10', () => {
    const ctx = makeContext(1);
    const history = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`, role: 'user' as const, content: `msg ${i}`, createdAt: '',
    }));
    const msgs = buildRagMessages('q', ctx, DEFAULT_RAG_CONFIG, history);
    expect(msgs.length).toBe(12);
  });
});

describe('formatCitationFooter', () => {
  it('returns empty for no citations', () => {
    const ctx: RagContext = { citations: [], contextText: '', tokenEstimate: 0 };
    expect(formatCitationFooter(ctx)).toBe('');
  });

  it('formats citations as markdown', () => {
    const ctx = makeContext(2);
    const footer = formatCitationFooter(ctx);
    expect(footer).toContain('**Sources:**');
    expect(footer).toContain('[1] **Note 1**');
    expect(footer).toContain('[2] **Note 2**');
    expect(footer).toContain('vector search');
  });

  it('shows graph source when applicable', () => {
    const ctx: RagContext = {
      citations: [makeCitation(1, { source: 'graph' })],
      contextText: '',
      tokenEstimate: 0,
    };
    const footer = formatCitationFooter(ctx);
    expect(footer).toContain('graph search');
  });
});
