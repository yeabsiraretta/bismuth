/**
 * Audio Player Parser — extracts file paths and bookmarks from
 * ```audio-player fenced code blocks.
 *
 * Supported formats:
 *   [[my file.mp3]]
 *   00:01:30 --- Chapter title
 *   00:00:44 --- intro
 */
import type { AudioPlayerBlock, AudioBookmark } from '../../types/audioPlayer';
import { generatePrefixedId } from '@/utils/id';

// ─── Patterns ────────────────────────────────────────────────────────────────

/** Wikilink: [[file.mp3]] */
const WIKILINK_RE = /\[\[([^\]]+)\]\]/;

/** Plain file path (no brackets) */
const PLAIN_FILE_RE = /^\s*([^\s].*\.(?:mp3|wav|ogg|flac|m4a|aac|webm))\s*$/i;

/** Bookmark line: HH:MM:SS --- label or MM:SS --- label */
const BOOKMARK_RE = /^\s*(\d{1,2}:\d{2}(?::\d{2})?)\s+---\s+(.+)\s*$/;

// ─── Time parsing ────────────────────────────────────────────────────────────

/** Parse a timestamp string (HH:MM:SS or MM:SS) to seconds */
export function parseTimestamp(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/** Format seconds to MM:SS or HH:MM:SS */
export function formatTimestamp(sec: number): string {
  const totalSec = Math.floor(sec);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

// ─── Block parsing ───────────────────────────────────────────────────────────

/** Parse the body of an ```audio-player block */
export function parseAudioPlayerBlock(body: string): {
  filePath: string | null;
  bookmarks: AudioBookmark[];
} {
  const lines = body.split('\n');
  let filePath: string | null = null;
  const bookmarks: AudioBookmark[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try wikilink
    if (!filePath) {
      const wikiMatch = trimmed.match(WIKILINK_RE);
      if (wikiMatch) {
        filePath = wikiMatch[1].trim();
        continue;
      }
    }

    // Try plain file path
    if (!filePath) {
      const plainMatch = trimmed.match(PLAIN_FILE_RE);
      if (plainMatch) {
        filePath = plainMatch[1].trim();
        continue;
      }
    }

    // Try bookmark
    const bmMatch = trimmed.match(BOOKMARK_RE);
    if (bmMatch) {
      bookmarks.push({
        id: generatePrefixedId('bm'),
        timeSec: parseTimestamp(bmMatch[1]),
        label: bmMatch[2].trim(),
      });
    }
  }

  return { filePath, bookmarks };
}

// ─── Find blocks ─────────────────────────────────────────────────────────────

/** Find all ```audio-player blocks in a document */
export function findAudioPlayerBlocks(text: string): AudioPlayerBlock[] {
  const blocks: AudioPlayerBlock[] = [];
  const regex = /^```audio-player\s*\n([\s\S]*?)^```/gm;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const body = match[1];
    const parsed = parseAudioPlayerBlock(body);
    if (parsed.filePath) {
      blocks.push({
        from: match.index,
        to: match.index + match[0].length,
        filePath: parsed.filePath,
        bookmarks: parsed.bookmarks,
      });
    }
  }

  return blocks;
}

/** Generate a sample audio-player block for insertion */
export function sampleAudioPlayerBlock(): string {
  return `\`\`\`audio-player
[[my audio file.mp3]]
00:00:44 --- intro
00:01:50 --- chapter 1
00:02:40 --- chapter 2
\`\`\``;
}
