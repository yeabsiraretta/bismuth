import { describe, it, expect } from 'vitest';
import { detectContentType, isUrl, splitBatch, formatDate } from '../services/contentDetector';

describe('detectContentType', () => {
  it('detects YouTube video', () => {
    const r = detectContentType('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(r.type).toBe('youtube');
    expect(r.id).toBe('dQw4w9WgXcQ');
  });

  it('detects YouTube shorts', () => {
    const r = detectContentType('https://youtube.com/shorts/abc12345678');
    expect(r.type).toBe('youtube');
    expect(r.id).toBe('abc12345678');
  });

  it('detects youtu.be short URL', () => {
    const r = detectContentType('https://youtu.be/dQw4w9WgXcQ');
    expect(r.type).toBe('youtube');
    expect(r.id).toBe('dQw4w9WgXcQ');
  });

  it('detects YouTube channel', () => {
    const r = detectContentType('https://youtube.com/@ChannelName');
    expect(r.type).toBe('youtube-channel');
    expect(r.id).toBe('ChannelName');
  });

  it('detects Twitter/X.com post', () => {
    const r = detectContentType('https://x.com/user/status/123456789');
    expect(r.type).toBe('twitter');
    expect(r.id).toBe('123456789');
  });

  it('detects Bluesky post', () => {
    const r = detectContentType('https://bsky.app/profile/user.bsky.social/post/abc');
    expect(r.type).toBe('bluesky');
  });

  it('detects StackOverflow question', () => {
    const r = detectContentType('https://stackoverflow.com/questions/12345/some-title');
    expect(r.type).toBe('stackexchange');
    expect(r.id).toBe('12345');
  });

  it('detects Pinterest pin', () => {
    const r = detectContentType('https://pinterest.com/pin/123456/');
    expect(r.type).toBe('pinterest');
    expect(r.id).toBe('123456');
  });

  it('detects Vimeo video', () => {
    const r = detectContentType('https://vimeo.com/12345678');
    expect(r.type).toBe('vimeo');
    expect(r.id).toBe('12345678');
  });

  it('detects Bilibili video', () => {
    const r = detectContentType('https://www.bilibili.com/video/BV1xx411c7XW');
    expect(r.type).toBe('bilibili');
    expect(r.id).toBe('BV1xx411c7XW');
  });

  it('detects TikTok video', () => {
    const r = detectContentType('https://www.tiktok.com/@user/video/7123456789012345678');
    expect(r.type).toBe('tiktok');
    expect(r.id).toBe('7123456789012345678');
  });

  it('falls back to website for valid URLs', () => {
    const r = detectContentType('https://example.com/article');
    expect(r.type).toBe('website');
  });

  it('falls back to text-snippet for non-URLs', () => {
    const r = detectContentType('Just some plain text');
    expect(r.type).toBe('text-snippet');
  });
});

describe('isUrl', () => {
  it('recognizes valid HTTP URL', () => expect(isUrl('https://example.com')).toBe(true));
  it('rejects plain text', () => expect(isUrl('hello world')).toBe(false));
  it('rejects ftp', () => expect(isUrl('ftp://files.example.com')).toBe(false));
});

describe('splitBatch', () => {
  it('splits by newline', () => {
    expect(splitBatch('a\nb\nc', '\n')).toEqual(['a', 'b', 'c']);
  });
  it('trims whitespace', () => {
    expect(splitBatch('  a  \n  b  ', '\n')).toEqual(['a', 'b']);
  });
  it('filters empty strings', () => {
    expect(splitBatch('a\n\nb', '\n')).toEqual(['a', 'b']);
  });
});

describe('formatDate', () => {
  it('formats YYYY-MM-DD', () => {
    const d = new Date(2025, 0, 15, 10, 30, 45);
    expect(formatDate(d, 'YYYY-MM-DD')).toBe('2025-01-15');
  });
  it('formats with time', () => {
    const d = new Date(2025, 11, 3, 8, 5, 2);
    expect(formatDate(d, 'YYYY-MM-DD HH:mm:ss')).toBe('2025-12-03 08:05:02');
  });
});
