import { describe, it, expect } from 'vitest';
import {
  parseTimestamp, formatTimestamp,
  parseAudioPlayerBlock, findAudioPlayerBlocks,
  sampleAudioPlayerBlock,
} from '../services/audioPlayer/audioPlayerParser';

describe('parseTimestamp', () => {
  it('parses MM:SS', () => {
    expect(parseTimestamp('01:30')).toBe(90);
    expect(parseTimestamp('00:00')).toBe(0);
    expect(parseTimestamp('10:05')).toBe(605);
  });

  it('parses HH:MM:SS', () => {
    expect(parseTimestamp('01:30:00')).toBe(5400);
    expect(parseTimestamp('00:01:30')).toBe(90);
    expect(parseTimestamp('02:00:00')).toBe(7200);
  });

  it('handles edge cases', () => {
    expect(parseTimestamp('0:00')).toBe(0);
    expect(parseTimestamp('0:01')).toBe(1);
  });
});

describe('formatTimestamp', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(90)).toBe('01:30');
    expect(formatTimestamp(605)).toBe('10:05');
  });

  it('formats to HH:MM:SS when over an hour', () => {
    expect(formatTimestamp(3600)).toBe('01:00:00');
    expect(formatTimestamp(3661)).toBe('01:01:01');
  });

  it('handles fractional seconds', () => {
    expect(formatTimestamp(90.7)).toBe('01:30');
  });
});

describe('parseAudioPlayerBlock', () => {
  it('extracts wikilink file path', () => {
    const result = parseAudioPlayerBlock('[[my file.mp3]]');
    expect(result.filePath).toBe('my file.mp3');
    expect(result.bookmarks).toHaveLength(0);
  });

  it('extracts plain file path', () => {
    const result = parseAudioPlayerBlock('audio/song.wav');
    expect(result.filePath).toBe('audio/song.wav');
  });

  it('extracts bookmarks', () => {
    const result = parseAudioPlayerBlock(
      '[[file.mp3]]\n00:00:44 --- chapter\n00:01:50 --- chapter 2'
    );
    expect(result.filePath).toBe('file.mp3');
    expect(result.bookmarks).toHaveLength(2);
    expect(result.bookmarks[0].timeSec).toBe(44);
    expect(result.bookmarks[0].label).toBe('chapter');
    expect(result.bookmarks[1].timeSec).toBe(110);
    expect(result.bookmarks[1].label).toBe('chapter 2');
  });

  it('handles MM:SS bookmark format', () => {
    const result = parseAudioPlayerBlock('[[f.mp3]]\n01:30 --- halfway');
    expect(result.bookmarks[0].timeSec).toBe(90);
  });

  it('returns null path for empty block', () => {
    expect(parseAudioPlayerBlock('').filePath).toBeNull();
    expect(parseAudioPlayerBlock('no audio here').filePath).toBeNull();
  });

  it('skips empty lines', () => {
    const result = parseAudioPlayerBlock('\n\n[[test.mp3]]\n\n');
    expect(result.filePath).toBe('test.mp3');
  });

  it('supports various audio extensions', () => {
    expect(parseAudioPlayerBlock('song.ogg').filePath).toBe('song.ogg');
    expect(parseAudioPlayerBlock('track.flac').filePath).toBe('track.flac');
    expect(parseAudioPlayerBlock('audio.m4a').filePath).toBe('audio.m4a');
    expect(parseAudioPlayerBlock('clip.webm').filePath).toBe('clip.webm');
  });
});

describe('findAudioPlayerBlocks', () => {
  it('finds audio-player blocks in document', () => {
    const text = 'Some text\n```audio-player\n[[test.mp3]]\n```\nMore text';
    const blocks = findAudioPlayerBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].filePath).toBe('test.mp3');
  });

  it('finds multiple blocks', () => {
    const text = '```audio-player\n[[a.mp3]]\n```\n\n```audio-player\n[[b.mp3]]\n```';
    const blocks = findAudioPlayerBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].filePath).toBe('a.mp3');
    expect(blocks[1].filePath).toBe('b.mp3');
  });

  it('ignores blocks without file path', () => {
    const text = '```audio-player\njust text\n```';
    expect(findAudioPlayerBlocks(text)).toHaveLength(0);
  });

  it('preserves bookmarks from block', () => {
    const text = '```audio-player\n[[f.mp3]]\n00:01:00 --- intro\n```';
    const blocks = findAudioPlayerBlocks(text);
    expect(blocks[0].bookmarks).toHaveLength(1);
    expect(blocks[0].bookmarks[0].label).toBe('intro');
  });

  it('captures from/to offsets', () => {
    const text = 'prefix\n```audio-player\n[[f.mp3]]\n```\nsuffix';
    const blocks = findAudioPlayerBlocks(text);
    expect(blocks[0].from).toBe(7); // after "prefix\n"
    expect(blocks[0].to).toBeGreaterThan(blocks[0].from);
  });
});

describe('sampleAudioPlayerBlock', () => {
  it('returns valid markdown', () => {
    const sample = sampleAudioPlayerBlock();
    expect(sample).toContain('```audio-player');
    expect(sample).toContain('```');
    expect(sample).toContain('[[');
    expect(sample).toContain('---');
  });
});
