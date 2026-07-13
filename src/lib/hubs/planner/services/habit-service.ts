/**
 * Habit service — parse & generate habit markdown files.
 *
 * Habit file format:
 * ```
 * ---
 * type: habit
 * frequency: daily
 * created: 2025-07-07
 * tags: [health, morning]
 * ---
 *
 * # Morning Routine
 *
 * Start each day with these activities.
 *
 * ## Tasks
 *
 * - [ ] Meditate for 10 minutes
 * - [ ] Exercise for 30 minutes
 *
 * ## Log
 *
 * - [x] 2025-07-07
 * - [x] 2025-07-06
 * - [ ] 2025-07-05
 * ```
 *
 * Pure functions, no side effects.
 */

// ── Types ────────────────────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface HabitTask {
  title: string;
  done: boolean;
}

export interface HabitLogEntry {
  date: string;
  completed: boolean;
}

export interface HabitData {
  name: string;
  description: string;
  frequency: HabitFrequency;
  repeatable: boolean;
  created: string;
  tags: string[];
  tasks: HabitTask[];
  log: HabitLogEntry[];
}

// ── Constants ────────────────────────────────────────────────────

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;
const TASK_LINE_RE = /^- \[([x ])\] (.+)$/;
const LOG_LINE_RE = /^- \[([x ])\] (\d{4}-\d{2}-\d{2})$/;
const VALID_FREQUENCIES: HabitFrequency[] = ['daily', 'weekdays', 'weekly', 'monthly'];

const HABITS_FOLDER = 'habits';

// ── Detection ────────────────────────────────────────────────────

export function isHabitFile(content: string): boolean {
  const fm = extractFrontmatter(content);
  return fm['type'] === 'habit';
}

// ── Frontmatter parsing ──────────────────────────────────────────

function extractFrontmatter(content: string): Record<string, string> {
  const m = FRONTMATTER_RE.exec(content);
  if (!m) return {};
  const result: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

function parseTags(raw: string): string[] {
  if (!raw) return [];
  const inner = raw.replace(/^\[/, '').replace(/\]$/, '');
  if (!inner.trim()) return [];
  return inner
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseFrequency(raw: string): HabitFrequency {
  const lower = raw.toLowerCase().trim() as HabitFrequency;
  return VALID_FREQUENCIES.includes(lower) ? lower : 'daily';
}

// ── Section extraction ───────────────────────────────────────────

function extractSection(content: string, heading: string): string[] {
  const lines = content.split('\n');
  const headingRe = new RegExp(`^##\\s+${heading}\\s*$`, 'i');
  let inSection = false;
  const result: string[] = [];

  for (const line of lines) {
    if (headingRe.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^##\s+/.test(line)) break;
    if (inSection) result.push(line);
  }
  return result;
}

function parseTasks(sectionLines: string[]): HabitTask[] {
  const tasks: HabitTask[] = [];
  for (const line of sectionLines) {
    const m = TASK_LINE_RE.exec(line.trim());
    if (m) {
      tasks.push({ title: m[2], done: m[1] === 'x' });
    }
  }
  return tasks;
}

function parseLog(sectionLines: string[]): HabitLogEntry[] {
  const entries: HabitLogEntry[] = [];
  for (const line of sectionLines) {
    const m = LOG_LINE_RE.exec(line.trim());
    if (m) {
      entries.push({ date: m[2], completed: m[1] === 'x' });
    }
  }
  return entries;
}

function extractDescription(content: string): string {
  const withoutFm = content.replace(FRONTMATTER_RE, '').trim();
  const lines = withoutFm.split('\n');
  const descLines: string[] = [];
  let pastTitle = false;

  for (const line of lines) {
    if (!pastTitle && /^# /.test(line)) {
      pastTitle = true;
      continue;
    }
    if (pastTitle && /^## /.test(line)) break;
    if (pastTitle) descLines.push(line);
  }
  return descLines.join('\n').trim();
}

function extractName(content: string): string {
  const withoutFm = content.replace(FRONTMATTER_RE, '').trim();
  for (const line of withoutFm.split('\n')) {
    if (/^# /.test(line)) return line.slice(2).trim();
  }
  return 'Untitled Habit';
}

// ── Main parser ──────────────────────────────────────────────────

export function parseHabitFile(content: string): HabitData {
  const fm = extractFrontmatter(content);
  return {
    name: extractName(content),
    description: extractDescription(content),
    frequency: parseFrequency(fm['frequency'] ?? 'daily'),
    repeatable: fm['repeatable'] === 'true',
    created: fm['created'] ?? todayStr(),
    tags: parseTags(fm['tags'] ?? ''),
    tasks: parseTasks(extractSection(content, 'Tasks')),
    log: parseLog(extractSection(content, 'Log')),
  };
}

// ── Content generation ───────────────────────────────────────────

export function generateHabitContent(data: {
  name: string;
  description?: string;
  frequency?: HabitFrequency;
  repeatable?: boolean;
  tags?: string[];
  tasks?: string[];
  log?: HabitLogEntry[];
}): string {
  const freq = data.frequency ?? 'daily';
  const tags = data.tags?.length ? `[${data.tags.join(', ')}]` : '[]';
  const created = todayStr();

  const parts: string[] = [
    '---',
    'type: habit',
    `frequency: ${freq}`,
    `repeatable: ${data.repeatable ? 'true' : 'false'}`,
    `created: ${created}`,
    `tags: ${tags}`,
    '---',
    '',
    `# ${data.name}`,
    '',
  ];

  if (data.description) {
    parts.push(data.description, '');
  }

  parts.push('## Tasks', '');
  if (data.tasks?.length) {
    for (const task of data.tasks) {
      parts.push(`- [ ] ${task}`);
    }
  }
  parts.push('');

  parts.push('## Log', '');
  if (data.log?.length) {
    for (const entry of data.log) {
      parts.push(`- [${entry.completed ? 'x' : ' '}] ${entry.date}`);
    }
  }
  parts.push('');

  return parts.join('\n');
}

// ── Content mutations (return new content) ───────────────────────

export function addTask(content: string, taskTitle: string): string {
  const lines = content.split('\n');
  const taskHeadingIdx = lines.findIndex((l) => /^## Tasks\s*$/i.test(l));

  if (taskHeadingIdx < 0) {
    // No Tasks section — append before Log or at end
    const logIdx = lines.findIndex((l) => /^## Log\s*$/i.test(l));
    const insertAt = logIdx >= 0 ? logIdx : lines.length;
    lines.splice(insertAt, 0, '## Tasks', '', `- [ ] ${taskTitle}`, '');
    return lines.join('\n');
  }

  // Find last task line in the section
  let insertAt = taskHeadingIdx + 1;
  for (let i = taskHeadingIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    if (TASK_LINE_RE.test(lines[i].trim())) insertAt = i + 1;
    else if (lines[i].trim() === '' && insertAt > taskHeadingIdx + 1) {
      insertAt = i;
      break;
    }
  }
  lines.splice(insertAt, 0, `- [ ] ${taskTitle}`);
  return lines.join('\n');
}

export function removeTask(content: string, taskIndex: number): string {
  const lines = content.split('\n');
  const taskLines = findTaskLineIndices(lines);
  if (taskIndex < 0 || taskIndex >= taskLines.length) return content;
  lines.splice(taskLines[taskIndex], 1);
  return lines.join('\n');
}

export function toggleTask(content: string, taskIndex: number): string {
  const lines = content.split('\n');
  const taskLines = findTaskLineIndices(lines);
  if (taskIndex < 0 || taskIndex >= taskLines.length) return content;

  const lineIdx = taskLines[taskIndex];
  const line = lines[lineIdx];
  if (line.includes('- [ ]')) {
    lines[lineIdx] = line.replace('- [ ]', '- [x]');
  } else if (line.includes('- [x]')) {
    lines[lineIdx] = line.replace('- [x]', '- [ ]');
  }
  return lines.join('\n');
}

export function resetAllTasks(content: string): string {
  const lines = content.split('\n');
  const taskLines = findTaskLineIndices(lines);
  for (const idx of taskLines) {
    lines[idx] = lines[idx].replace('- [x]', '- [ ]');
  }
  return lines.join('\n');
}

export function setAllTasks(content: string, done: boolean): string {
  const lines = content.split('\n');
  const taskLines = findTaskLineIndices(lines);
  for (const idx of taskLines) {
    if (done) {
      lines[idx] = lines[idx].replace('- [ ]', '- [x]');
    } else {
      lines[idx] = lines[idx].replace('- [x]', '- [ ]');
    }
  }
  return lines.join('\n');
}

export function renameHabit(content: string, newName: string): string {
  const allLines = content.split('\n');
  for (let i = 0; i < allLines.length; i++) {
    if (/^# /.test(allLines[i])) {
      allLines[i] = `# ${newName}`;
      return allLines.join('\n');
    }
  }
  return content;
}

export function setRepeatable(content: string, repeatable: boolean): string {
  const lines = content.split('\n');
  const fmEnd = lines.indexOf('---', 1);
  if (fmEnd < 0) return content;

  const repeatableIdx = lines.findIndex(
    (l, i) => i > 0 && i < fmEnd && l.startsWith('repeatable:')
  );

  if (repeatableIdx >= 0) {
    lines[repeatableIdx] = `repeatable: ${repeatable ? 'true' : 'false'}`;
  } else {
    lines.splice(fmEnd, 0, `repeatable: ${repeatable ? 'true' : 'false'}`);
  }
  return lines.join('\n');
}

export function logCompletion(content: string, date: string, completed: boolean): string {
  const lines = content.split('\n');
  const logHeadingIdx = lines.findIndex((l) => /^## Log\s*$/i.test(l));

  const entry = `- [${completed ? 'x' : ' '}] ${date}`;

  if (logHeadingIdx < 0) {
    lines.push('', '## Log', '', entry, '');
    return lines.join('\n');
  }

  // Check if this date already has an entry
  for (let i = logHeadingIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    const m = LOG_LINE_RE.exec(lines[i].trim());
    if (m && m[2] === date) {
      lines[i] = entry;
      return lines.join('\n');
    }
  }

  // Insert after heading (newest first)
  const insertAt = logHeadingIdx + 1;
  // Skip blank lines right after heading
  let actualInsert = insertAt;
  while (actualInsert < lines.length && lines[actualInsert].trim() === '') {
    actualInsert++;
  }
  lines.splice(actualInsert, 0, entry);
  return lines.join('\n');
}

// ── Streak computation ───────────────────────────────────────────

export function computeStreak(log: HabitLogEntry[], frequency: HabitFrequency = 'daily'): number {
  if (log.length === 0) return 0;

  const completedDates = new Set(log.filter((e) => e.completed).map((e) => e.date));

  let streak = 0;
  const today = todayStr();
  let current = today;

  for (let i = 0; i < 365; i++) {
    if (frequency === 'weekdays' && isWeekend(current)) {
      current = prevDay(current);
      continue;
    }

    if (completedDates.has(current)) {
      streak++;
      current =
        frequency === 'weekly'
          ? prevWeek(current)
          : frequency === 'monthly'
            ? prevMonth(current)
            : prevDay(current);
    } else if (current === today) {
      // Today not yet completed doesn't break the streak
      current =
        frequency === 'weekly'
          ? prevWeek(current)
          : frequency === 'monthly'
            ? prevMonth(current)
            : prevDay(current);
    } else {
      break;
    }
  }
  return streak;
}

export function allTasksDone(tasks: HabitTask[]): boolean {
  return tasks.length > 0 && tasks.every((t) => t.done);
}

export function noTasksDone(tasks: HabitTask[]): boolean {
  return tasks.length > 0 && tasks.every((t) => !t.done);
}

export function taskProgress(tasks: HabitTask[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.done).length, total: tasks.length };
}

// ── Habit file path helpers ──────────────────────────────────────

export function habitFileName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '.md'
  );
}

export function habitFilePath(name: string): string {
  return `${HABITS_FOLDER}/${habitFileName(name)}`;
}

// ── Date helpers (pure) ──────────────────────────────────────────

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return fmtDate(d);
}

function prevWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 7);
  return fmtDate(d);
}

function prevMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() - 1);
  return fmtDate(d);
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Internal helpers ─────────────────────────────────────────────

function findTaskLineIndices(lines: string[]): number[] {
  const taskHeadingIdx = lines.findIndex((l) => /^## Tasks\s*$/i.test(l));
  if (taskHeadingIdx < 0) return [];

  const indices: number[] = [];
  for (let i = taskHeadingIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    if (TASK_LINE_RE.test(lines[i].trim())) indices.push(i);
  }
  return indices;
}
