/**
 * Parser unit tests — PICT pairwise coverage of all 6 card syntaxes.
 */
import { describe, it, expect } from 'vitest';
import { parseFlashcards } from '../services/parser';
import { parseStudyVaultCards, parseAllCards } from '../services/studyParser';

// ─── Inline basic ────────────────────────────────────────────────────────────

describe('parseFlashcards: inline basic (::)', () => {
  it('parses a single inline card', () => {
    const result = parseFlashcards('test.md', 'What is Rust :: A systems language');
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].type).toBe('basic');
    expect(result.cards[0].front).toBe('What is Rust');
    expect(result.cards[0].back).toBe('A systems language');
  });

  it('assigns deck from note path', () => {
    const result = parseFlashcards('Courses/AWS/chapter1.md', 'Q :: A');
    expect(result.cards[0].deck).toBe('Bismuth::Courses::AWS');
  });

  it('ignores reversed syntax (:::) as inline-basic', () => {
    const result = parseFlashcards('test.md', 'Front ::: Back');
    expect(result.cards[0].type).toBe('basic-reversed');
  });

  it('returns empty for note with no cards', () => {
    const result = parseFlashcards('test.md', '# Just a heading\nSome prose.');
    expect(result.cards).toHaveLength(0);
    expect(result.hasCards).toBe(false);
  });
});

// ─── Cloze ────────────────────────────────────────────────────────────────────

describe('parseFlashcards: cloze', () => {
  it('converts ==highlight== to cloze format', () => {
    const result = parseFlashcards('test.md', 'The ==OSI model== has 7 layers.');
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].type).toBe('cloze');
    expect(result.cards[0].front).toContain('{{c1::OSI model}}');
  });

  it('converts {curly brace} to cloze format', () => {
    const result = parseFlashcards('test.md', 'HTTP uses port {80} by default.');
    expect(result.cards[0].type).toBe('cloze');
    expect(result.cards[0].front).toContain('{{c1::80}}');
  });

  it('numbers multiple clozes sequentially', () => {
    const result = parseFlashcards('test.md', '==A== and ==B== are clozes.');
    const front = result.cards[0].front;
    expect(front).toContain('{{c1::A}}');
    expect(front).toContain('{{c2::B}}');
  });
});

// ─── Frontmatter tags ─────────────────────────────────────────────────────────

describe('parseFlashcards: tag extraction', () => {
  it('includes frontmatter array tags', () => {
    const content = '---\ntags: [aws, cloud]\n---\nQ :: A';
    const result = parseFlashcards('test.md', content);
    expect(result.cards[0].tags).toContain('aws');
    expect(result.cards[0].tags).toContain('cloud');
  });

  it('always includes bismuth tag', () => {
    const result = parseFlashcards('test.md', 'Q :: A');
    expect(result.cards[0].tags).toContain('bismuth');
  });
});

// ─── Study Vault ## Q: format ─────────────────────────────────────────────────

describe('parseStudyVaultCards: ## Q: / **A:** format', () => {
  it('parses heading-style Q&A', () => {
    const content = '## Q: What is the OSI model?\n**A:** A 7-layer framework.';
    const cards = parseStudyVaultCards('topic.md', content);
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe('What is the OSI model?');
    expect(cards[0].back).toBe('A 7-layer framework.');
    expect(cards[0].tags).toContain('study-vault');
  });

  it('handles multiple Q&A pairs', () => {
    const content = '## Q: Q1?\n**A:** A1.\n\n## Q: Q2?\n**A:** A2.';
    const cards = parseStudyVaultCards('topic.md', content);
    expect(cards).toHaveLength(2);
  });
});

// ─── parseAllCards combines both parsers ──────────────────────────────────────

describe('parseAllCards: deduplication', () => {
  it('combines standard and Study Vault cards without duplicates', () => {
    const content = 'Inline :: Card\n\n## Q: Heading?\n**A:** Answer.';
    const cards = parseAllCards('test.md', content);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    const ids = cards.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─── Multi-line ? / ?? separators (SR-style) ─────────────────────────────────

describe('parseFlashcards: multi-line ? separator', () => {
  it('parses question ? answer as multiline card', () => {
    const content = 'What is TCP?\n?\nTransmission Control Protocol\n';
    const result = parseFlashcards('test.md', content);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].type).toBe('multiline');
    expect(result.cards[0].front).toBe('What is TCP?');
    expect(result.cards[0].back).toBe('Transmission Control Protocol');
  });

  it('parses ?? as multiline-reversed card', () => {
    const content = 'What is UDP?\n??\nUser Datagram Protocol\n';
    const result = parseFlashcards('test.md', content);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].type).toBe('multiline-reversed');
  });

  it('handles multi-line answer terminated by blank line', () => {
    const content = 'Question\n?\nLine 1\nLine 2\n\nOther content';
    const result = parseFlashcards('test.md', content);
    expect(result.cards[0].back).toBe('Line 1\nLine 2');
  });
});

// ─── Bold cloze ─────────────────────────────────────────────────────────────

describe('parseFlashcards: **bold** cloze', () => {
  it('converts **bold** to cloze deletion', () => {
    const result = parseFlashcards('test.md', 'The **capital** of France is Paris.');
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].type).toBe('cloze');
    expect(result.cards[0].front).toContain('{{c1::capital}}');
  });

  it('does NOT match **label:** patterns', () => {
    const result = parseFlashcards('test.md', '**A:** This is an answer');
    const clozeCards = result.cards.filter((c) => c.type === 'cloze');
    expect(clozeCards).toHaveLength(0);
  });
});

// ─── #flashcards deck tag ───────────────────────────────────────────────────

describe('parseFlashcards: #flashcards deck tags', () => {
  it('derives deck from #flashcards/sub/path tag in body', () => {
    const content = '#flashcards/CS/Algorithms\nQ :: A';
    const result = parseFlashcards('test.md', content);
    expect(result.cards[0].deck).toBe('Bismuth::CS::Algorithms');
  });

  it('derives deck from frontmatter flashcards tag', () => {
    const content = '---\ntags: [flashcards/Math]\n---\nQ :: A';
    const result = parseFlashcards('test.md', content);
    expect(result.cards[0].deck).toBe('Bismuth::Math');
  });

  it('falls back to path-based deck when no #flashcards tag', () => {
    const result = parseFlashcards('Notes/CS/test.md', 'Q :: A');
    expect(result.cards[0].deck).toBe('Bismuth::Notes::CS');
  });
});

// ─── Heading context ────────────────────────────────────────────────────────

describe('parseFlashcards: heading context', () => {
  it('includes heading breadcrumb in card context', () => {
    const content = '# Chapter 1\n## Section A\nQ :: A';
    const result = parseFlashcards('test.md', content);
    expect(result.cards[0].context).toBe('test > Chapter 1 > Section A');
  });

  it('provides note title when no headings', () => {
    const result = parseFlashcards('test.md', 'Q :: A');
    expect(result.cards[0].context).toBe('test');
  });
});

// ─── Stable ID ────────────────────────────────────────────────────────────────

describe('card ID stability', () => {
  it('same note path + content produces same ID', () => {
    const r1 = parseFlashcards('test.md', 'Q :: A');
    const r2 = parseFlashcards('test.md', 'Q :: A');
    expect(r1.cards[0].id).toBe(r2.cards[0].id);
  });

  it('different path produces different ID', () => {
    const r1 = parseFlashcards('a.md', 'Q :: A');
    const r2 = parseFlashcards('b.md', 'Q :: A');
    expect(r1.cards[0].id).not.toBe(r2.cards[0].id);
  });
});
