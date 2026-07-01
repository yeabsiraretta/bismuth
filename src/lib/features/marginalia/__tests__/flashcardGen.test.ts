import { describe, it, expect } from 'vitest';
import {
  extractFlashcards, formatFlashcardsSection, formatAnkiExport,
  injectFlashcards, flashcardStats,
} from '../services/flashcardGen';

describe('extractFlashcards', () => {
  it('extracts flashcards from blur-tagged notes', () => {
    const content = 'The mitochondria produces energy. %%> What produces energy?;; %%';
    const cards = extractFlashcards(content, 'test.md');
    expect(cards).toHaveLength(1);
    expect(cards[0].question).toBe('What produces energy?');
    expect(cards[0].answer).toBe('The mitochondria produces energy.');
  });

  it('ignores non-blur notes', () => {
    const content = 'Text here %%> Regular note %%';
    const cards = extractFlashcards(content, 'test.md');
    expect(cards).toHaveLength(0);
  });

  it('extracts multiple flashcards', () => {
    const content = [
      'ATP is adenosine triphosphate. %%> What is ATP?;; %%',
      'The cell membrane controls transport. %%> What controls transport?;; %%',
    ].join('\n');
    const cards = extractFlashcards(content, 'test.md');
    expect(cards).toHaveLength(2);
  });

  it('handles prefix + blur combo', () => {
    const content = 'Krebs cycle occurs in matrix. %%> ? Where does Krebs cycle occur?;; %%';
    const cards = extractFlashcards(content, 'test.md');
    expect(cards).toHaveLength(1);
    expect(cards[0].question).toBe('Where does Krebs cycle occur?');
  });

  it('records source line', () => {
    const content = 'Line 1\nImportant fact. %%> Cue;; %%\nLine 3';
    const cards = extractFlashcards(content, 'bio.md');
    expect(cards[0].sourceLine).toBe(2);
    expect(cards[0].filePath).toBe('bio.md');
  });
});

describe('formatFlashcardsSection', () => {
  it('formats cards as markdown', () => {
    const cards = [{ question: 'Q1', answer: 'A1', sourceLine: 1, filePath: 'test.md' }];
    const md = formatFlashcardsSection(cards);
    expect(md).toContain('### Flashcards');
    expect(md).toContain('**Q:** Q1');
    expect(md).toContain('**A:** A1');
  });

  it('returns empty for no cards', () => {
    expect(formatFlashcardsSection([])).toBe('');
  });
});

describe('formatAnkiExport', () => {
  it('formats tab-separated Q/A', () => {
    const cards = [
      { question: 'Q1', answer: 'A1', sourceLine: 1, filePath: 'test.md' },
      { question: 'Q2', answer: 'A2', sourceLine: 2, filePath: 'test.md' },
    ];
    const anki = formatAnkiExport(cards);
    expect(anki).toBe('Q1\tA1\nQ2\tA2');
  });
});

describe('injectFlashcards', () => {
  it('appends flashcard section to content', () => {
    const content = 'Fact. %%> Q?;; %%';
    const result = injectFlashcards(content, 'test.md');
    expect(result).toContain('### Flashcards');
    expect(result).toContain('**Q:** Q?');
  });

  it('replaces existing flashcard section', () => {
    const content = 'Fact. %%> New Q?;; %%\n\n### Flashcards\n\n**Q:** Old Q\n**A:** Old A';
    const result = injectFlashcards(content, 'test.md');
    const headingCount = (result.match(/### Flashcards/g) || []).length;
    expect(headingCount).toBe(1);
    expect(result).toContain('**Q:** New Q?');
  });

  it('returns content unchanged if no blur notes', () => {
    const content = 'Regular text %%> Note %%';
    const result = injectFlashcards(content, 'test.md');
    expect(result).toBe(content);
  });
});

describe('flashcardStats', () => {
  it('returns correct counts', () => {
    const content = 'A. %%> Q1;; %%\nB. %%> Note %% %%> Q2;; %%';
    const stats = flashcardStats(content, 'test.md');
    expect(stats.total).toBe(3);
    expect(stats.blurCount).toBe(2);
    expect(stats.cardCount).toBe(2);
  });
});
