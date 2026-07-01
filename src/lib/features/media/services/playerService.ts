/**
 * Media player service — URL parsing, timestamp formatting, transcript parsing.
 *
 * Handles:
 *   - Media URL parsing with fragment support (#t=start,end)
 *   - Timestamp ↔ seconds conversion
 *   - SRT/VTT transcript file parsing
 *   - Screenshot capture from HTML5 video elements
 *   - Timestamp link generation for notes
 */

import { log } from '@/utils/logger';
import type {
  MediaSource,
  MediaType,
  TranscriptCue,
  Transcript,
  TimestampLink,
  ScreenshotCapture,
} from '../types/player';
import { AUDIO_EXTENSIONS, VIDEO_EXTENSIONS } from '../types/player';

// ─── Time formatting ─────────────────────────────────────────────────────────

/** Format seconds to HH:MM:SS or MM:SS display string. */
export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hrs > 0) return `${String(hrs).padStart(2, '0')}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

/** Parse a timestamp string (HH:MM:SS, MM:SS, or SS) to seconds. */
export function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/** Parse SRT timestamp format (HH:MM:SS,mmm). */
function parseSrtTime(ts: string): number {
  const [time, ms] = ts.split(',');
  return parseTimestamp(time) + parseInt(ms || '0', 10) / 1000;
}

/** Parse VTT timestamp format (HH:MM:SS.mmm or MM:SS.mmm). */
function parseVttTime(ts: string): number {
  const [time, ms] = ts.split('.');
  return parseTimestamp(time) + parseInt(ms || '0', 10) / 1000;
}

// ─── Media URL / path parsing ────────────────────────────────────────────────

/** Detect media type from file extension. */
export function detectMediaType(pathOrUrl: string): MediaType | null {
  const ext = pathOrUrl.split('.').pop()?.toLowerCase()?.split('?')[0]?.split('#')[0] ?? '';
  if ((AUDIO_EXTENSIONS as readonly string[]).includes(ext)) return 'audio';
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(ext)) return 'video';
  return null;
}

/** Parse #t=start,end fragment from a URL. */
export function parseTimeFragment(url: string): { start?: number; end?: number } {
  const hashIdx = url.indexOf('#');
  if (hashIdx < 0) return {};
  const fragment = url.slice(hashIdx + 1);
  const tMatch = /t=([^&]+)/.exec(fragment);
  if (!tMatch) return {};
  const parts = tMatch[1].split(',');
  const start = parts[0] ? parseTimestamp(parts[0]) : undefined;
  const end = parts[1] ? parseTimestamp(parts[1]) : undefined;
  return { start, end };
}

/** Parse loop and autoplay flags from fragment. */
function parseFragmentFlags(url: string): { loop: boolean; autoplay: boolean } {
  const hashIdx = url.indexOf('#');
  if (hashIdx < 0) return { loop: false, autoplay: false };
  const fragment = url.slice(hashIdx + 1);
  return {
    loop: fragment.includes('loop'),
    autoplay: fragment.includes('autoplay'),
  };
}

/** Parse a media URL/path into a MediaSource. Returns null if not a media file. */
export function parseMediaSource(urlOrPath: string): MediaSource | null {
  const cleanUrl = urlOrPath.split('#')[0].split('?')[0];
  const type = detectMediaType(cleanUrl);
  if (!type) return null;

  const { start, end } = parseTimeFragment(urlOrPath);
  const { loop, autoplay } = parseFragmentFlags(urlOrPath);

  const isRemote = /^https?:\/\//.test(urlOrPath);
  const playableUrl = isRemote ? cleanUrl : `file://${cleanUrl}`;
  const title =
    cleanUrl
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ?? 'Untitled';

  return {
    url: urlOrPath,
    playableUrl,
    type,
    title,
    startTime: start,
    endTime: end,
    loop,
    autoplay,
  };
}

// ─── Transcript parsing ──────────────────────────────────────────────────────

/** Parse SRT subtitle content into cues. */
export function parseSrt(content: string): TranscriptCue[] {
  const blocks = content.trim().split(/\n\n+/);
  const cues: TranscriptCue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length < 3) continue;
    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;
    const timeLine = lines[1];
    const timeMatch = /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/.exec(timeLine);
    if (!timeMatch) continue;
    cues.push({
      index,
      startTime: parseSrtTime(timeMatch[1]),
      endTime: parseSrtTime(timeMatch[2]),
      text: lines
        .slice(2)
        .join(' ')
        .replace(/<[^>]+>/g, ''),
    });
  }
  return cues;
}

/** Parse VTT (WebVTT) subtitle content into cues. */
export function parseVtt(content: string): TranscriptCue[] {
  const lines = content.split('\n');
  const cues: TranscriptCue[] = [];
  let idx = 0;
  let i = 0;
  // Skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) i++;
  while (i < lines.length) {
    const line = lines[i].trim();
    const timeMatch = /([\d:.]+)\s*-->\s*([\d:.]+)/.exec(line);
    if (timeMatch) {
      idx++;
      const textLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }
      cues.push({
        index: idx,
        startTime: parseVttTime(timeMatch[1]),
        endTime: parseVttTime(timeMatch[2]),
        text: textLines.join(' ').replace(/<[^>]+>/g, ''),
      });
    } else {
      i++;
    }
  }
  return cues;
}

/** Parse a transcript file (auto-detect SRT vs VTT). */
export function parseTranscript(content: string, sourcePath: string): Transcript {
  const isVtt = content.trimStart().startsWith('WEBVTT');
  const cues = isVtt ? parseVtt(content) : parseSrt(content);
  const format = isVtt ? 'vtt' : 'srt';
  log.debug('playerService: parsed transcript', { format, cues: cues.length, sourcePath });
  return { cues, format, sourcePath };
}

// ─── Timestamp link generation ───────────────────────────────────────────────

/** Generate a timestamp link for inserting into a note. */
export function createTimestampLink(source: string, timeSeconds: number, label?: string): string {
  const display = formatTimestamp(timeSeconds);
  const fragment = `#t=${display.replace(/:/g, ':')}`;
  if (label) return `[${label} (${display})](${source}${fragment})`;
  return `[${display}](${source}${fragment})`;
}

/** Parse a timestamp link from note text. */
export function parseTimestampLink(text: string): TimestampLink | null {
  // Matches [HH:MM:SS](source#t=HH:MM:SS) or [label (HH:MM:SS)](source#t=...)
  const re = /\[([^\]]+)\]\(([^)]+)#t=([^)]+)\)/;
  const m = re.exec(text);
  if (!m) return null;
  const displayOrLabel = m[1];
  const source = m[2];
  const timePart = m[3].split(',')[0];
  const time = parseTimestamp(timePart);
  const endPart = m[3].split(',')[1];
  const endTime = endPart ? parseTimestamp(endPart) : undefined;
  return { source, time, display: formatTimestamp(time), endTime, label: displayOrLabel };
}

// ─── Screenshot capture ──────────────────────────────────────────────────────

/** Capture the current frame of a video element as a data URL. */
export function captureVideoFrame(
  video: HTMLVideoElement,
  sourceMedia: string
): ScreenshotCapture | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  log.debug('playerService: screenshot captured', { time: video.currentTime, w: canvas.width });
  return {
    dataUrl,
    captureTime: video.currentTime,
    sourceMedia,
    width: canvas.width,
    height: canvas.height,
  };
}
