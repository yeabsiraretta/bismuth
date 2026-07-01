import { describe, it, expect } from 'vitest';
import {
  formatTimestamp,
  parseTimestamp,
  detectMediaType,
  parseMediaSource,
  parseTimeFragment,
  parseSrt,
  parseVtt,
  createTimestampLink,
  parseTimestampLink,
} from '../services/playerService';

describe('formatTimestamp', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(65)).toBe('01:05');
    expect(formatTimestamp(599)).toBe('09:59');
  });
  it('formats to HH:MM:SS for >= 1 hour', () => {
    expect(formatTimestamp(3661)).toBe('01:01:01');
    expect(formatTimestamp(7200)).toBe('02:00:00');
  });
  it('clamps negative values to 00:00', () => {
    expect(formatTimestamp(-5)).toBe('00:00');
  });
});

describe('parseTimestamp', () => {
  it('parses MM:SS', () => {
    expect(parseTimestamp('01:30')).toBe(90);
    expect(parseTimestamp('00:05')).toBe(5);
  });
  it('parses HH:MM:SS', () => {
    expect(parseTimestamp('01:02:03')).toBe(3723);
  });
  it('parses bare seconds', () => {
    expect(parseTimestamp('45')).toBe(45);
  });
  it('returns 0 for invalid', () => {
    expect(parseTimestamp('abc')).toBe(0);
    expect(parseTimestamp('')).toBe(0);
  });
});

describe('detectMediaType', () => {
  it('detects audio files', () => {
    expect(detectMediaType('song.mp3')).toBe('audio');
    expect(detectMediaType('/path/to/file.ogg')).toBe('audio');
    expect(detectMediaType('track.flac')).toBe('audio');
  });
  it('detects video files', () => {
    expect(detectMediaType('video.mp4')).toBe('video');
    expect(detectMediaType('/path/clip.webm')).toBe('video');
    expect(detectMediaType('movie.mkv')).toBe('video');
  });
  it('returns null for non-media', () => {
    expect(detectMediaType('notes.md')).toBeNull();
    expect(detectMediaType('image.png')).toBeNull();
  });
  it('strips query/fragment before detecting', () => {
    expect(detectMediaType('file.mp4?v=1')).toBe('video');
    expect(detectMediaType('file.mp3#t=10')).toBe('audio');
  });
});

describe('parseTimeFragment', () => {
  it('parses #t=start', () => {
    expect(parseTimeFragment('file.mp4#t=01:30')).toEqual({ start: 90, end: undefined });
  });
  it('parses #t=start,end', () => {
    expect(parseTimeFragment('file.mp4#t=00:10,01:00')).toEqual({ start: 10, end: 60 });
  });
  it('returns empty for no fragment', () => {
    expect(parseTimeFragment('file.mp4')).toEqual({});
  });
  it('returns empty for fragment without #t=', () => {
    expect(parseTimeFragment('file.mp4#loop')).toEqual({});
  });
});

describe('parseMediaSource', () => {
  it('parses a local video path', () => {
    const s = parseMediaSource('/vault/media/clip.mp4');
    expect(s).not.toBeNull();
    expect(s!.type).toBe('video');
    expect(s!.title).toBe('clip');
    expect(s!.playableUrl).toBe('file:///vault/media/clip.mp4');
  });
  it('parses a remote audio URL', () => {
    const s = parseMediaSource('https://example.com/song.mp3');
    expect(s!.type).toBe('audio');
    expect(s!.playableUrl).toBe('https://example.com/song.mp3');
  });
  it('extracts time fragment', () => {
    const s = parseMediaSource('clip.mp4#t=00:30,01:00');
    expect(s!.startTime).toBe(30);
    expect(s!.endTime).toBe(60);
  });
  it('extracts loop/autoplay flags', () => {
    const s = parseMediaSource('clip.mp4#t=0&loop&autoplay');
    expect(s!.loop).toBe(true);
    expect(s!.autoplay).toBe(true);
  });
  it('returns null for non-media', () => {
    expect(parseMediaSource('doc.pdf')).toBeNull();
  });
});

describe('parseSrt', () => {
  const sample = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,500 --> 00:00:08,000
Second line`;

  it('parses cues correctly', () => {
    const cues = parseSrt(sample);
    expect(cues).toHaveLength(2);
    expect(cues[0].index).toBe(1);
    expect(cues[0].startTime).toBeCloseTo(1.0);
    expect(cues[0].endTime).toBeCloseTo(4.0);
    expect(cues[0].text).toBe('Hello world');
    expect(cues[1].index).toBe(2);
    expect(cues[1].startTime).toBeCloseTo(5.5);
  });
});

describe('parseVtt', () => {
  const sample = `WEBVTT

00:01.000 --> 00:04.000
Hello world

00:05.500 --> 00:08.000
Second line`;

  it('parses cues correctly', () => {
    const cues = parseVtt(sample);
    expect(cues).toHaveLength(2);
    expect(cues[0].startTime).toBeCloseTo(1.0);
    expect(cues[0].text).toBe('Hello world');
    expect(cues[1].startTime).toBeCloseTo(5.5);
  });
});

describe('createTimestampLink', () => {
  it('creates a basic timestamp link', () => {
    expect(createTimestampLink('clip.mp4', 90)).toBe('[01:30](clip.mp4#t=01:30)');
  });
  it('creates a labeled timestamp link', () => {
    expect(createTimestampLink('clip.mp4', 90, 'Key point')).toBe(
      '[Key point (01:30)](clip.mp4#t=01:30)'
    );
  });
});

describe('parseTimestampLink', () => {
  it('parses a timestamp link', () => {
    const result = parseTimestampLink('[01:30](clip.mp4#t=01:30)');
    expect(result).not.toBeNull();
    expect(result!.source).toBe('clip.mp4');
    expect(result!.time).toBe(90);
    expect(result!.display).toBe('01:30');
  });
  it('parses a range timestamp link', () => {
    const result = parseTimestampLink('[intro](file.mp4#t=00:10,01:00)');
    expect(result!.time).toBe(10);
    expect(result!.endTime).toBe(60);
  });
  it('returns null for non-timestamp links', () => {
    expect(parseTimestampLink('just text')).toBeNull();
    expect(parseTimestampLink('[link](url)')).toBeNull();
  });
});
