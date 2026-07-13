import { describe, expect, it } from 'vitest';

import { ankiDeckToMarkdown, type AnkiNote } from '@/hubs/knowledge/services/anki-sync-service';

describe('Anki Sync Service', () => {
  describe('ankiDeckToMarkdown', () => {
    const sampleNotes: AnkiNote[] = [
      {
        noteId: 1,
        modelName: 'Basic',
        fields: {
          Front: { value: 'What is photosynthesis?', order: 0 },
          Back: { value: 'The process by which plants convert light to energy', order: 1 },
        },
        tags: ['biology', 'plants'],
      },
      {
        noteId: 2,
        modelName: 'Basic',
        fields: {
          Front: { value: 'What is mitosis?', order: 0 },
          Back: { value: 'Cell division producing two identical cells', order: 1 },
        },
        tags: ['biology'],
      },
      {
        noteId: 3,
        modelName: 'Cloze',
        fields: {
          Text: { value: 'The capital of France is <b>Paris</b>', order: 0 },
          Extra: { value: '', order: 1 },
        },
        tags: [],
      },
    ];

    it('generates valid frontmatter', () => {
      const md = ankiDeckToMarkdown('Biology::Cell', sampleNotes);
      expect(md).toContain('---');
      expect(md).toContain('title: "Biology::Cell"');
      expect(md).toContain('source: anki');
      expect(md).toContain('card_count: 3');
    });

    it('includes deck name as heading', () => {
      const md = ankiDeckToMarkdown('My Deck', sampleNotes);
      expect(md).toContain('# My Deck');
    });

    it('formats cards as front :: back', () => {
      const md = ankiDeckToMarkdown('Bio', sampleNotes);
      expect(md).toContain(
        '- What is photosynthesis? :: The process by which plants convert light to energy #biology #plants'
      );
      expect(md).toContain(
        '- What is mitosis? :: Cell division producing two identical cells #biology'
      );
    });

    it('strips HTML from card content', () => {
      const md = ankiDeckToMarkdown('Geo', sampleNotes);
      expect(md).toContain('- The capital of France is Paris :: ');
      expect(md).not.toContain('<b>');
    });

    it('handles empty notes array', () => {
      const md = ankiDeckToMarkdown('Empty', []);
      expect(md).toContain('# Empty');
      expect(md).toContain('card_count: 0');
    });

    it('handles notes with missing back field', () => {
      const notes: AnkiNote[] = [
        {
          noteId: 10,
          modelName: 'Basic',
          fields: {
            Front: { value: 'Only front', order: 0 },
          },
          tags: [],
        },
      ];
      const md = ankiDeckToMarkdown('Single', notes);
      expect(md).toContain('- Only front :: ');
    });

    it('handles HTML entities', () => {
      const notes: AnkiNote[] = [
        {
          noteId: 11,
          modelName: 'Basic',
          fields: {
            Front: { value: '2 &gt; 1 &amp; 1 &lt; 2', order: 0 },
            Back: { value: '&quot;true&quot;', order: 1 },
          },
          tags: [],
        },
      ];
      const md = ankiDeckToMarkdown('Math', notes);
      expect(md).toContain('2 > 1 & 1 < 2');
      expect(md).toContain('"true"');
    });

    it('handles <br> tags as newlines', () => {
      const notes: AnkiNote[] = [
        {
          noteId: 12,
          modelName: 'Basic',
          fields: {
            Front: { value: 'Line1<br>Line2<br/>Line3', order: 0 },
            Back: { value: 'answer', order: 1 },
          },
          tags: [],
        },
      ];
      const md = ankiDeckToMarkdown('Test', notes);
      expect(md).toContain('Line1\nLine2\nLine3');
    });

    it('includes synced_at timestamp', () => {
      const md = ankiDeckToMarkdown('Time', []);
      expect(md).toMatch(/synced_at: "\d{4}-\d{2}-\d{2}T/);
    });
  });
});
