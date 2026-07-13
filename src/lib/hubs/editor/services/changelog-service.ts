import { getChangelog } from '@/hubs/core/stores/settings-store.svelte';
import { readNote, writeNote } from '@/sal/note-service';
import { log } from '@/utils/log/logger';

const changelogLog = log.child('changelog');

// ── SemVer types & helpers ──────────────────────────────────────────────────

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
  build: string;
}

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export function parseSemVer(version: string): SemVer | null {
  const m = SEMVER_RE.exec(version);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? '',
    build: m[5] ?? '',
  };
}

export function formatSemVer(v: SemVer): string {
  let s = `${v.major}.${v.minor}.${v.patch}`;
  if (v.prerelease) s += `-${v.prerelease}`;
  if (v.build) s += `+${v.build}`;
  return s;
}

function compareIdentifiers(a: string, b: string): number {
  const aNum = /^\d+$/.test(a);
  const bNum = /^\d+$/.test(b);
  if (aNum && bNum) return Number(a) - Number(b);
  if (aNum) return -1;
  if (bNum) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareSemVer(a: SemVer, b: SemVer): number {
  const d = a.major - b.major || a.minor - b.minor || a.patch - b.patch;
  if (d !== 0) return d;
  if (!a.prerelease && !b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  const ap = a.prerelease.split('.'),
    bp = b.prerelease.split('.');
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    if (i >= ap.length) return -1;
    if (i >= bp.length) return 1;
    const c = compareIdentifiers(ap[i], bp[i]);
    if (c !== 0) return c;
  }
  return 0;
}

export type BumpKind = 'major' | 'minor' | 'patch' | 'prerelease';

export function bumpVersion(v: SemVer, kind: BumpKind, prereleaseTag?: string): SemVer {
  switch (kind) {
    case 'major':
      return { major: v.major + 1, minor: 0, patch: 0, prerelease: '', build: '' };
    case 'minor':
      return { major: v.major, minor: v.minor + 1, patch: 0, prerelease: '', build: '' };
    case 'patch':
      return { major: v.major, minor: v.minor, patch: v.patch + 1, prerelease: '', build: '' };
    case 'prerelease': {
      const tag = prereleaseTag ?? 'alpha';
      if (v.prerelease.startsWith(tag + '.')) {
        const num = Number(v.prerelease.slice(tag.length + 1));
        return { ...v, prerelease: `${tag}.${(isNaN(num) ? 0 : num) + 1}`, build: '' };
      }
      return { ...v, prerelease: `${tag}.1`, build: '' };
    }
  }
}

// ── Internal helpers ────────────────────────────────────────────────────────

function formatDate(fmt: string): string {
  const now = new Date();
  return fmt
    .replace('yyyy', String(now.getFullYear()))
    .replace('MM', String(now.getMonth() + 1).padStart(2, '0'))
    .replace('dd', String(now.getDate()).padStart(2, '0'))
    .replace('HH', String(now.getHours()).padStart(2, '0'))
    .replace('mm', String(now.getMinutes()).padStart(2, '0'));
}

function noteLink(path: string, useWikilinks: boolean): string {
  const name = path.replace(/\.md$/, '').split('/').pop() ?? path;
  return useWikilinks ? `[[${name}]]` : `[${name}](${path})`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function appendChangelog(notePath: string): Promise<void> {
  const cfg = getChangelog();
  if (!cfg.changelogAutoUpdate) return;

  const excluded = cfg.changelogExcludedFolders
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
  if (excluded.some((f) => notePath.startsWith(f + '/'))) return;
  if (notePath === cfg.changelogPath) return;

  const version = cfg.changelogVersion || '0.1.0';
  const timestamp = formatDate(cfg.changelogDatetimeFormat);
  const link = noteLink(notePath, cfg.changelogUseWikilinks);
  const entry = `- ${timestamp} — ${link}`;

  try {
    let existing = '';
    try {
      const note = await readNote(cfg.changelogPath);
      existing = note.content;
    } catch {
      existing = `# Changelog\n\nAll notable changes to this vault are documented in this file.\nThis project uses [Semantic Versioning](https://semver.org/).\n`;
    }

    const versionHeading = `## [${version}] — ${todayISO()}`;
    const headingRe = new RegExp(
      `^## \\[${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`,
      'm'
    );
    const match = headingRe.exec(existing);

    let updated: string;
    if (match) {
      const insertPos = match.index + match[0].length;
      const restOfLine = existing.indexOf('\n', insertPos);
      const insertAt = restOfLine === -1 ? existing.length : restOfLine;
      updated = existing.slice(0, insertAt) + `\n${entry}` + existing.slice(insertAt);
    } else {
      const firstVersionIdx = existing.search(/^## \[/m);
      if (firstVersionIdx === -1) {
        updated = existing.trimEnd() + `\n\n${versionHeading}\n${entry}\n`;
      } else {
        updated =
          existing.slice(0, firstVersionIdx) +
          `${versionHeading}\n${entry}\n\n` +
          existing.slice(firstVersionIdx);
      }
    }

    const lines = updated.split('\n');
    const currentSectionStart = lines.findIndex((l) => headingRe.test(l));
    if (currentSectionStart !== -1) {
      let count = 0;
      let cutFrom = -1;
      for (let i = currentSectionStart + 1; i < lines.length; i++) {
        if (/^## \[/.test(lines[i])) break;
        if (lines[i].startsWith('- ')) {
          count++;
          if (count > cfg.changelogMaxFiles) {
            cutFrom = i;
            break;
          }
        }
      }
      if (cutFrom !== -1) {
        let cutTo = cutFrom;
        while (cutTo < lines.length && !/^## \[/.test(lines[cutTo + 1] ?? '')) {
          if (lines[cutTo + 1]?.startsWith('- ') || cutTo + 1 >= lines.length) break;
          cutTo++;
        }
        const endCut = cutTo;
        while (endCut < lines.length - 1 && lines[endCut + 1]?.startsWith('- ')) {
          cutTo = endCut + 1;
        }
        lines.splice(cutFrom, lines.length - cutFrom);
        updated = lines.join('\n') + '\n';
      }
    }

    await writeNote(cfg.changelogPath, updated);
    changelogLog.debug('Changelog updated', { notePath, version });
  } catch (err) {
    changelogLog.debug('Changelog update failed', { error: String(err) });
  }
}

async function bumpChangelogVersion(
  kind: BumpKind,
  prereleaseTag?: string
): Promise<string | null> {
  const cfg = getChangelog();
  const current = parseSemVer(cfg.changelogVersion || '0.1.0');
  if (!current) return null;
  const next = bumpVersion(current, kind, prereleaseTag);
  return formatSemVer(next);
}
