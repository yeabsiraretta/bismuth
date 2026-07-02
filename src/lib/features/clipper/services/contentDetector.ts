/**
 * Content type detector — classifies URLs into content types
 * and extracts embed IDs for video/social platforms.
 *
 * Detection order matches Obsidian ReadItLater priority:
 * YouTube > YouTube Channel > Twitter > Bluesky > StackExchange >
 * Pinterest > Mastodon > Vimeo > Bilibili > TikTok > Website > Text Snippet
 */

import type { ContentType } from '../types';

interface DetectionRule {
  type: ContentType;
  test: (url: string) => boolean;
  extractId?: (url: string) => string | null;
}

const RULES: DetectionRule[] = [
  {
    type: 'youtube',
    test: (url) => /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/.test(url),
    extractId: (url) => {
      const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      return m?.[1] ?? null;
    },
  },
  {
    type: 'youtube-channel',
    test: (url) =>
      /youtube\.com\/(?:channel|c|@)[/]?[a-zA-Z0-9_-]/.test(url) && !/\/watch\?/.test(url),
    extractId: (url) => {
      const m = url.match(/youtube\.com\/(?:channel\/|c\/|@)([^/?&]+)/);
      return m?.[1] ?? null;
    },
  },
  {
    type: 'twitter',
    test: (url) => /(?:twitter\.com|x\.com)\/\w+\/status\//.test(url),
    extractId: (url) => {
      const m = url.match(/\/status\/(\d+)/);
      return m?.[1] ?? null;
    },
  },
  {
    type: 'bluesky',
    test: (url) => /bsky\.app\/profile\//.test(url),
  },
  {
    type: 'stackexchange',
    test: (url) =>
      /(?:stackoverflow\.com|stackexchange\.com|serverfault\.com|superuser\.com|askubuntu\.com)\/questions\//.test(
        url
      ),
    extractId: (url) => {
      const m = url.match(/\/questions\/(\d+)/);
      return m?.[1] ?? null;
    },
  },
  {
    type: 'pinterest',
    test: (url) => /pinterest\.\w+\/pin\//.test(url),
    extractId: (url) => {
      const m = url.match(/\/pin\/(\d+)/);
      return m?.[1] ?? null;
    },
  },
  {
    type: 'mastodon',
    test: (url) => /\/@\w+\/\d+/.test(url) && !/twitter\.com|x\.com/.test(url),
    extractId: (url) => {
      const m = url.match(/\/@\w+\/(\d+)/);
      return m?.[1] ?? null;
    },
  },
  {
    type: 'vimeo',
    test: (url) => /vimeo\.com\/\d+/.test(url),
    extractId: (url) => {
      const m = url.match(/vimeo\.com\/(\d+)/);
      return m?.[1] ?? null;
    },
  },
  {
    type: 'bilibili',
    test: (url) => /bilibili\.com\/video\//.test(url),
    extractId: (url) => {
      const m = url.match(/\/video\/([a-zA-Z0-9]+)/);
      return m?.[1] ?? null;
    },
  },
  {
    type: 'tiktok',
    test: (url) => /tiktok\.com\/@[\w.]+\/video\//.test(url),
    extractId: (url) => {
      const m = url.match(/\/video\/(\d+)/);
      return m?.[1] ?? null;
    },
  },
];

/** Detect content type from a URL. Falls back to 'website' for valid URLs, 'text-snippet' otherwise. */
export function detectContentType(input: string): { type: ContentType; id: string | null } {
  const trimmed = input.trim();

  for (const rule of RULES) {
    if (rule.test(trimmed)) {
      return { type: rule.type, id: rule.extractId?.(trimmed) ?? null };
    }
  }

  // Check if it's a valid URL
  if (isUrl(trimmed)) {
    return { type: 'website', id: null };
  }

  return { type: 'text-snippet', id: null };
}

/** Check if a string is a valid URL. */
export function isUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Split batch input by delimiter into individual URLs/texts. */
export function splitBatch(input: string, delimiter: string): string[] {
  return input
    .split(delimiter)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Generate an embed player iframe for video content types. */
export function generateVideoEmbed(type: ContentType, videoId: string): string {
  switch (type) {
    case 'youtube':
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
    case 'vimeo':
      return `<iframe src="https://player.vimeo.com/video/${videoId}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
    case 'bilibili':
      return `<iframe src="https://player.bilibili.com/player.html?bvid=${videoId}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
    case 'tiktok':
      return `<blockquote class="tiktok-embed" data-video-id="${videoId}"><a href="https://www.tiktok.com/video/${videoId}">TikTok Video</a></blockquote>`;
    default:
      return '';
  }
}

/** Build base template variables available for all content types. */
export function buildBaseVariables(url: string, dateFormat: string): Record<string, string> {
  const now = new Date();
  const date = formatDate(now, dateFormat);
  return { date, url };
}

/** Simple date formatter supporting common format tokens. */
export function formatDate(d: Date, fmt: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return fmt
    .replace('YYYY', String(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
}
