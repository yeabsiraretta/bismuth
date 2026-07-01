/**
 * Clipper store — manages web clipping state, batch processing,
 * and note creation from clipboard URLs/text.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { showToast } from '@/stores/toast/toast';
import type { ClippedItem, ClipperConfig, ContentType, TemplateContext } from '../types';
import { detectContentType, splitBatch, buildBaseVariables, generateVideoEmbed } from '../services/contentDetector';
import { renderTemplate, getTemplates, sanitizeFilename, loadClipperConfig, saveClipperConfig } from '../services/templateEngine';

/** Clipped items history */
export const clippedItems = writable<ClippedItem[]>(loadHistory());
export const clipperConfig = writable<ClipperConfig>(loadClipperConfig());
export const isClipping = writable(false);

/** Derived: items grouped by status */
export const clipperStats = derived(clippedItems, ($items) => ({
  total: $items.length,
  pending: $items.filter(i => i.status === 'pending').length,
  saved: $items.filter(i => i.status === 'saved').length,
  errors: $items.filter(i => i.status === 'error').length,
}));

/** Update and persist config */
export function updateConfig(partial: Partial<ClipperConfig>): void {
  clipperConfig.update(c => {
    const updated = { ...c, ...partial };
    saveClipperConfig(updated);
    return updated;
  });
}

/** Create a note from clipboard content. */
export async function clipFromClipboard(): Promise<void> {
  try {
    const text = await navigator.clipboard.readText();
    if (!text?.trim()) {
      showToast('Clipboard is empty', 'warning');
      return;
    }
    await clipContent(text.trim());
  } catch (error) {
    log.error('Failed to read clipboard', error as Error);
    showToast('Failed to read clipboard', 'error');
  }
}

/** Create notes from batch clipboard content. */
export async function clipBatchFromClipboard(): Promise<void> {
  try {
    const text = await navigator.clipboard.readText();
    if (!text?.trim()) {
      showToast('Clipboard is empty', 'warning');
      return;
    }
    const config = get(clipperConfig);
    const items = splitBatch(text, config.batchDelimiter);
    if (items.length === 0) {
      showToast('No items found in clipboard', 'warning');
      return;
    }

    isClipping.set(true);
    let created = 0;
    for (const item of items) {
      try {
        await clipContent(item);
        created++;
      } catch (e) {
        log.error('Batch clip item failed', e as Error, { item });
      }
    }
    showToast(`Clipped ${created} of ${items.length} items`, 'info');
  } catch (error) {
    log.error('Batch clip failed', error as Error);
    showToast('Batch clip failed', 'error');
  } finally {
    isClipping.set(false);
  }
}

/** Core clipping function — detect content type, build variables, render template, create note. */
export async function clipContent(input: string): Promise<string> {
  const config = get(clipperConfig);
  const { type, id } = detectContentType(input);

  const baseVars = buildBaseVariables(input, config.dateFormat);
  const contentVars = buildContentVars(type, input, id, baseVars);
  const templates = getTemplates(type, config);

  const title = sanitizeFilename(renderTemplate(templates.title, contentVars));
  const content = renderTemplate(templates.content, contentVars);
  const fileName = title || `Clip ${baseVars['date']}`;

  const item: ClippedItem = {
    id: crypto.randomUUID(),
    url: input,
    contentType: type,
    title: fileName,
    content,
    createdAt: new Date().toISOString(),
    notePath: null,
    status: 'pending',
  };

  clippedItems.update(items => [item, ...items]);

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const notePath = `${config.inboxDir}/${fileName}.md`;
    await invoke('write_file', { path: notePath, content });
    item.notePath = notePath;
    item.status = 'saved';
    clippedItems.update(items => items.map(i => i.id === item.id ? { ...item } : i));
    saveHistory(get(clippedItems));
    showToast(`Clipped: ${fileName}`, 'info');
    return notePath;
  } catch (error) {
    item.status = 'error';
    item.error = String(error);
    clippedItems.update(items => items.map(i => i.id === item.id ? { ...item } : i));
    log.error('Failed to save clipped note', error as Error);
    throw error;
  }
}

/** Insert clipped content at cursor position in active editor. */
export async function insertAtCursor(): Promise<void> {
  try {
    const text = await navigator.clipboard.readText();
    if (!text?.trim()) {
      showToast('Clipboard is empty', 'warning');
      return;
    }

    const config = get(clipperConfig);
    const { type, id } = detectContentType(text.trim());
    const baseVars = buildBaseVariables(text.trim(), config.dateFormat);
    const contentVars = buildContentVars(type, text.trim(), id, baseVars);
    const templates = getTemplates(type, config);
    const content = renderTemplate(templates.content, contentVars);

    const editorEl = document.querySelector('.cm-editor') as HTMLElement | null;
    if (!editorEl) {
      showToast('No editor focused', 'warning');
      return;
    }
    const view = (editorEl as unknown as { cmView?: { view: unknown } }).cmView?.view;
    if (!view) {
      showToast('No editor focused', 'warning');
      return;
    }
    const { EditorView } = await import('@codemirror/view');
    if (view instanceof EditorView) {
      const cursor = view.state.selection.main.head;
      view.dispatch({
        changes: { from: cursor, insert: '\n' + content + '\n' },
        userEvent: 'input.clipper',
      });
      showToast('Content inserted at cursor', 'info');
    }
  } catch (error) {
    log.error('Insert at cursor failed', error as Error);
    showToast('Failed to insert content', 'error');
  }
}

/** Clear clip history */
export function clearHistory(): void {
  clippedItems.set([]);
  saveHistory([]);
}

/** Build content-specific template variables using Object.assign for index-signature compat. */
function buildContentVars(
  type: ContentType, url: string, id: string | null, base: Record<string, string>
): TemplateContext {
  const vars: TemplateContext = { ...base };
  const CONTENT_VARS: Record<ContentType, () => Record<string, string>> = {
    youtube: () => ({
      videoURL: url, videoId: id ?? '', videoTitle: `YouTube Video ${id ?? ''}`,
      videoPlayer: id ? generateVideoEmbed('youtube', id) : '', videoDescription: '',
      channelName: '', channelURL: '', channelId: '',
      videoThumbnail: id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '',
      videoPublishDate: base['date'] ?? '', videoChapters: '', videoViewsCount: '',
    }),
    'youtube-channel': () => ({
      channelURL: url, channelId: id ?? '', channelTitle: id ?? '',
      channelDescription: '', channelAvatar: '', channelBanner: '',
      channelSubscribersCount: '', channelVideosCount: '',
      channelVideosURL: `${url}/videos`, channelShortsURL: `${url}/shorts`,
    }),
    twitter: () => ({
      tweetURL: url, tweetAuthorName: '', tweetContent: '',
      tweetPublishDate: base['date'] ?? '',
    }),
    bluesky: () => ({
      postURL: url, authorHandle: '', authorName: '', content: '',
      likeCount: '', replyCount: '', repostCount: '', quoteCount: '',
      publishedAt: base['date'] ?? '',
    }),
    stackexchange: () => ({
      questionURL: url, questionTitle: `Question ${id ?? ''}`, questionContent: '',
      authorName: '', authorProfileURL: '', topAnswer: '', answers: '',
    }),
    pinterest: () => ({
      pinURL: url, pinId: id ?? '', title: '', link: url, image: '',
      description: '', likeCount: '', authorName: '', authorProfileURL: '',
    }),
    mastodon: () => ({ tootURL: url, tootAuthorName: '', tootContent: '' }),
    vimeo: () => ({
      videoURL: url, videoId: id ?? '', videoTitle: `Vimeo Video ${id ?? ''}`,
      videoPlayer: id ? generateVideoEmbed('vimeo', id) : '',
      channelName: '', channelURL: '',
    }),
    bilibili: () => ({
      videoURL: url, videoId: id ?? '', videoTitle: `Bilibili Video ${id ?? ''}`,
      videoPlayer: id ? generateVideoEmbed('bilibili', id) : '',
    }),
    tiktok: () => ({
      videoURL: url, videoId: id ?? '', videoDescription: '',
      videoPlayer: id ? generateVideoEmbed('tiktok', id) : '',
      authorName: '', authorURL: '',
    }),
    website: () => ({
      articleURL: url, articleTitle: '', articleContent: '',
      articleReadingTime: '', previewURL: '', publishedTime: '',
    }),
    'text-snippet': () => ({ content: url }),
  };
  Object.assign(vars, CONTENT_VARS[type]());
  return vars;
}

function loadHistory(): ClippedItem[] {
  try {
    const raw = localStorage.getItem('bismuth-clip-history');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(items: ClippedItem[]): void {
  try {
    localStorage.setItem('bismuth-clip-history', JSON.stringify(items.slice(0, 100)));
  } catch { /* noop */ }
}
