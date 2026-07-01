/**
 * Compile service — execute compile workflows to produce manuscript output.
 */

import type { CompileWorkflow, CompileStep, CompileResult } from '../types/compile';
import type { SceneEntity, ChapterEntity } from '../types/entity';
import { BUILTIN_WORKFLOWS } from '../types/compile';

const CUSTOM_WORKFLOWS_KEY = 'bismuth-storyteller-compile-workflows';

// ─── Workflow persistence ───────────────────────────────────────────────────

export function loadWorkflows(): CompileWorkflow[] {
  const builtIn = BUILTIN_WORKFLOWS;
  try {
    const raw = localStorage.getItem(CUSTOM_WORKFLOWS_KEY);
    const custom: CompileWorkflow[] = raw ? JSON.parse(raw) : [];
    return [...builtIn, ...custom];
  } catch { return builtIn; }
}

export function persistCustomWorkflows(workflows: CompileWorkflow[]): void {
  const custom = workflows.filter(w => !w.isBuiltIn);
  try { localStorage.setItem(CUSTOM_WORKFLOWS_KEY, JSON.stringify(custom)); }
  catch { /* silent */ }
}

export function createWorkflow(name: string, description = ''): CompileWorkflow {
  return {
    id: crypto.randomUUID(), name, description,
    steps: [], outputFormat: 'markdown', isBuiltIn: false,
  };
}

// ─── Step execution ─────────────────────────────────────────────────────────

export function executeWorkflow(
  workflow: CompileWorkflow,
  scenes: SceneEntity[],
  chapters: ChapterEntity[],
): CompileResult {
  const warnings: string[] = [];
  let content = '';
  const enabledSteps = workflow.steps.filter(s => s.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  // Build raw content from scenes ordered by chapter
  const orderedScenes = orderScenes(scenes, chapters);
  let currentChapter = '';

  for (const scene of orderedScenes) {
    const chapterId = scene.chapterId;
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter && chapter.name !== currentChapter) {
      currentChapter = chapter.name;
      content += applyChapterHeader(currentChapter, enabledSteps);
    }
    content += applySceneContent(scene, enabledSteps);
  }

  // Post-processing steps
  for (const step of enabledSteps) {
    content = applyPostStep(content, step, warnings);
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return { content, wordCount, sceneCount: orderedScenes.length, chapterCount: chapters.length, warnings };
}

function orderScenes(scenes: SceneEntity[], chapters: ChapterEntity[]): SceneEntity[] {
  const chapterOrder = new Map<string, number>();
  chapters.forEach((c, i) => chapterOrder.set(c.id, i));
  return [...scenes].sort((a, b) => {
    const ca = chapterOrder.get(a.chapterId ?? '') ?? 999;
    const cb = chapterOrder.get(b.chapterId ?? '') ?? 999;
    if (ca !== cb) return ca - cb;
    return a.sortOrder - b.sortOrder;
  });
}

function applyChapterHeader(name: string, steps: CompileStep[]): string {
  const hasBreak = steps.some(s => s.type === 'add-chapter-breaks' && s.enabled);
  return hasBreak ? `\n\n# ${name}\n\n` : '';
}

function applySceneContent(scene: SceneEntity, steps: CompileStep[]): string {
  let text = '';
  const hasTitle = steps.some(s => s.type === 'add-scene-titles' && s.enabled);
  if (hasTitle) text += `## ${scene.name}\n\n`;
  text += (scene.synopsis ?? scene.description) + '\n';
  const sep = steps.find(s => s.type === 'scene-separator' && s.enabled);
  if (sep) text += `\n${(sep.config as Record<string, string>).separator ?? '---'}\n\n`;
  else text += '\n';
  return text;
}

function applyPostStep(content: string, step: CompileStep, warnings: string[]): string {
  switch (step.type) {
    case 'strip-frontmatter':
      return content.replace(/^---\n[\s\S]*?\n---\n/gm, '');
    case 'strip-comments':
      return content.replace(/%%[\s\S]*?%%/g, '').replace(/<!--[\s\S]*?-->/g, '');
    case 'table-of-contents': {
      const headings = content.match(/^#{1,3}\s.+$/gm) ?? [];
      if (headings.length > 0) {
        const toc = headings.map(h => {
          const level = (h.match(/^#+/) ?? [''])[0].length;
          const title = h.replace(/^#+\s/, '');
          return `${'  '.repeat(level - 1)}- ${title}`;
        }).join('\n');
        return `# Table of Contents\n\n${toc}\n\n${content}`;
      }
      return content;
    }
    case 'word-count': {
      const wc = content.split(/\s+/).filter(Boolean).length;
      return `*Word count: ${wc.toLocaleString()}*\n\n${content}`;
    }
    case 'custom-js': {
      const code = (step.config as Record<string, string>).code;
      if (code) {
        try {
          const fn = new Function('content', 'warnings', code);
          return String(fn(content, warnings));
        } catch (e) {
          warnings.push(`Custom JS step "${step.label}" failed: ${String(e)}`);
        }
      }
      return content;
    }
    default: return content;
  }
}
