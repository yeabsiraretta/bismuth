/**
 * Export service — export stories to MD, JSON, CSV, HTML formats.
 */

import type { ExportOptions, ExportFormat, ExportScope } from '../types/project';
import type { StorytellerEntity, SceneEntity, ChapterEntity } from '../types/entity';
import type { Story } from '../types/story';

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

// ─── Main export ────────────────────────────────────────────────────────────

export function exportProject(
  story: Story,
  entities: StorytellerEntity[],
  options: ExportOptions
): ExportResult {
  const scenes = entities.filter((e) => e.type === 'scene') as unknown as SceneEntity[];
  const chapters = entities.filter((e) => e.type === 'chapter') as unknown as ChapterEntity[];
  switch (options.format) {
    case 'markdown':
      return exportMarkdown(story, scenes, chapters, entities, options);
    case 'json':
      return exportJson(story, entities, options);
    case 'csv':
      return exportCsv(story, scenes, options);
    case 'html':
      return exportHtml(story, scenes, chapters, entities, options);
    default:
      return exportMarkdown(story, scenes, chapters, entities, options);
  }
}

// ─── Markdown ───────────────────────────────────────────────────────────────

function exportMarkdown(
  story: Story,
  scenes: SceneEntity[],
  chapters: ChapterEntity[],
  entities: StorytellerEntity[],
  options: ExportOptions
): ExportResult {
  let md = `# ${story.name}\n\n`;
  if (options.includeMetadata) {
    md += `> Created: ${new Date(story.createdAt).toLocaleDateString()}\n`;
    md += `> Words: ${story.wordCount.toLocaleString()}\n\n`;
  }
  if (options.scope === 'manuscript') {
    const sorted = sortScenesByChapter(scenes, chapters);
    let currentChapter = '';
    for (const scene of sorted) {
      const ch = chapters.find((c) => c.id === scene.chapterId);
      if (ch && ch.name !== currentChapter) {
        currentChapter = ch.name;
        md += `\n## ${currentChapter}\n\n`;
      }
      md += `### ${scene.name}\n\n`;
      md += (scene.synopsis ?? scene.description ?? '') + '\n\n---\n\n';
    }
  } else {
    md += buildOutline(scenes, chapters, entities);
  }
  if (options.includeStats) {
    md += `\n---\n\n**Statistics**\n- Scenes: ${scenes.length}\n- Chapters: ${chapters.length}\n- Words: ${story.wordCount.toLocaleString()}\n`;
    const readingTime = Math.ceil(story.wordCount / 250);
    md += `- Reading time: ~${readingTime} min\n`;
  }
  return { content: md, filename: `${story.name}.md`, mimeType: 'text/markdown' };
}

function buildOutline(
  scenes: SceneEntity[],
  chapters: ChapterEntity[],
  entities: StorytellerEntity[]
): string {
  let out = '## Outline\n\n';
  for (const ch of chapters) {
    out += `### ${ch.name}\n\n`;
    const chScenes = scenes
      .filter((s) => s.chapterId === ch.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const sc of chScenes) {
      out += `- **${sc.name}** [${sc.status}]`;
      if (sc.pov) out += ` — POV: ${sc.pov}`;
      out += `\n`;
      if (sc.synopsis) out += `  ${sc.synopsis}\n`;
    }
    out += '\n';
  }
  const characters = entities.filter((e) => e.type === 'character');
  if (characters.length > 0) {
    out += '## Characters\n\n';
    for (const c of characters) {
      out += `- **${c.name}**: ${c.description.slice(0, 120)}\n`;
    }
    out += '\n';
  }
  return out;
}

// ─── JSON ───────────────────────────────────────────────────────────────────

function exportJson(
  story: Story,
  entities: StorytellerEntity[],
  options: ExportOptions
): ExportResult {
  const data =
    options.scope === 'outline'
      ? {
          story: { name: story.name, wordCount: story.wordCount },
          entities: entities.map((e) => ({
            id: e.id,
            type: e.type,
            name: e.name,
            description: e.description.slice(0, 200),
          })),
        }
      : { story, entities };
  return {
    content: JSON.stringify(data, null, 2),
    filename: `${story.name}.json`,
    mimeType: 'application/json',
  };
}

// ─── CSV ────────────────────────────────────────────────────────────────────

function exportCsv(story: Story, scenes: SceneEntity[], options: ExportOptions): ExportResult {
  const headers = ['Name', 'Status', 'POV', 'Word Count', 'Chapter', 'Synopsis'];
  const rows = scenes.map((sc) =>
    [
      sc.name,
      sc.status,
      sc.pov ?? '',
      String(sc.wordCount ?? 0),
      sc.chapterId ?? '',
      (sc.synopsis ?? '').replace(/"/g, '""'),
    ]
      .map((v) => `"${v}"`)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  return { content: csv, filename: `${story.name}.csv`, mimeType: 'text/csv' };
}

// ─── HTML ───────────────────────────────────────────────────────────────────

function exportHtml(
  story: Story,
  scenes: SceneEntity[],
  chapters: ChapterEntity[],
  entities: StorytellerEntity[],
  options: ExportOptions
): ExportResult {
  let body = '';
  if (options.scope === 'manuscript') {
    const sorted = sortScenesByChapter(scenes, chapters);
    let currentChapter = '';
    for (const scene of sorted) {
      const ch = chapters.find((c) => c.id === scene.chapterId);
      if (ch && ch.name !== currentChapter) {
        currentChapter = ch.name;
        body += `<h2>${esc(currentChapter)}</h2>\n`;
      }
      body += `<h3>${esc(scene.name)}</h3>\n`;
      body += `<p>${esc(scene.synopsis ?? scene.description ?? '')}</p>\n<hr>\n`;
    }
  } else {
    body += `<h2>Outline</h2>\n<ul>\n`;
    for (const sc of scenes)
      body += `<li><strong>${esc(sc.name)}</strong> [${esc(sc.status)}]</li>\n`;
    body += `</ul>\n`;
  }
  const html =
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(story.name)}</title>` +
    `<style>body{max-width:700px;margin:40px auto;font-family:${options.fontFamily};font-size:${options.fontSize}px;line-height:1.6;color:#333;}h1{border-bottom:2px solid #333;}hr{border:none;border-top:1px solid #ccc;margin:2em 0;}</style>` +
    `</head><body><h1>${esc(story.name)}</h1>\n${body}</body></html>`;
  return { content: html, filename: `${story.name}.html`, mimeType: 'text/html' };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sortScenesByChapter(scenes: SceneEntity[], chapters: ChapterEntity[]): SceneEntity[] {
  const order = new Map(chapters.map((c, i) => [c.id, i]));
  return [...scenes].sort((a, b) => {
    const ca = order.get(a.chapterId ?? '') ?? 999;
    const cb = order.get(b.chapterId ?? '') ?? 999;
    return ca !== cb ? ca - cb : a.sortOrder - b.sortOrder;
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
