/**
 * Unified API client for Bismuth.
 *
 * Routes requests through:
 *   1. Tauri IPC (when running inside the desktop app)
 *   2. Local HTTP REST API (when running in a browser or external tool)
 *
 * The HTTP API runs on `http://127.0.0.1:21721/api/...` and the MCP endpoint
 * is at `http://127.0.0.1:21721/mcp`.
 */

import { invokeCommand } from '@/ipc/invoke';
import { isTauriAvailable } from '@/utils/platform';

const LOCAL_API_BASE = 'http://127.0.0.1:21721';
const CONFIGURED_API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
const API_BASE = CONFIGURED_API_BASE || (isTauriAvailable() ? LOCAL_API_BASE : '');

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

async function httpGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function httpPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function httpPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
}

async function httpDelete(path: string): Promise<void> {
  const res = await fetch(apiUrl(path), { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
}

// ── Dual-path API ───────────────────────────────────────────────────────────

interface ApiStatus {
  ok: boolean;
  version: string;
  vaultOpen: boolean;
}

async function getApiStatus(): Promise<ApiStatus> {
  return httpGet('/api/status');
}

async function listNotes<T>(): Promise<T[]> {
  if (isTauriAvailable()) return invokeCommand<T[]>('scan_vault');
  return httpGet('/api/notes');
}

async function readNote<T>(path: string): Promise<T> {
  if (isTauriAvailable()) return invokeCommand<T>('read_note', { path });
  return httpGet(`/api/notes/${encodeURIComponent(path)}`);
}

async function writeNote(path: string, content: string): Promise<void> {
  if (isTauriAvailable()) {
    await invokeCommand('write_note', { path, content });
    return;
  }
  await httpPut(`/api/notes/${encodeURIComponent(path)}`, { content });
}

async function createNote<T>(title: string, folder?: string): Promise<T> {
  if (isTauriAvailable()) return invokeCommand<T>('create_note', { title, folder });
  return httpPost('/api/notes', { title, folder });
}

async function deleteNote(path: string): Promise<void> {
  if (isTauriAvailable()) {
    await invokeCommand('delete_note', { path });
    return;
  }
  await httpDelete(`/api/notes/${encodeURIComponent(path)}`);
}

async function searchVault<T>(query: string): Promise<T[]> {
  if (isTauriAvailable()) return invokeCommand<T[]>('search_vault', { query });
  return httpGet(`/api/search?q=${encodeURIComponent(query)}`);
}

async function getVaultStats<T>(): Promise<T> {
  if (isTauriAvailable()) return invokeCommand<T>('compute_vault_stats');
  return httpGet('/api/stats');
}

async function getVaultTags<T>(): Promise<T[]> {
  if (isTauriAvailable()) return invokeCommand<T[]>('extract_vault_tags');
  return httpGet('/api/tags');
}

async function getGraphData<T>(): Promise<T> {
  if (isTauriAvailable()) return invokeCommand<T>('build_graph_data');
  return httpGet('/api/graph');
}

// ── Canvas ────────────────────────────────────────────────────────────────────

async function listCanvases<T>(): Promise<T[]> {
  if (isTauriAvailable()) {
    const all = await invokeCommand<T[]>('scan_vault');
    return (all as Array<{ path: string } & T>).filter((n) => n.path.endsWith('.canvas')) as T[];
  }
  return httpGet('/api/canvases');
}

async function readCanvas(path: string): Promise<string> {
  if (isTauriAvailable()) {
    const n = await invokeCommand<{ content: string }>('read_note', { path });
    return n.content;
  }
  const n = await httpGet<{ content: string }>(`/api/notes/${encodeURIComponent(path)}`);
  return n.content;
}

async function writeCanvas(path: string, content: string): Promise<void> {
  return writeNote(path, content);
}

// ── Git ──────────────────────────────────────────────────────────────────────

interface GitStatus {
  branch: string;
  clean: boolean;
  staged: number;
  modified: number;
  untracked: number;
}

async function getGitStatus(): Promise<GitStatus> {
  if (isTauriAvailable()) return invokeCommand<GitStatus>('git_status');
  return httpGet('/api/git/status');
}

async function gitStageAll(): Promise<void> {
  if (isTauriAvailable()) {
    await invokeCommand('git_stage_all');
    return;
  }
  await httpPost('/api/git/stage');
}

async function gitCommit(message: string): Promise<void> {
  if (isTauriAvailable()) {
    await invokeCommand('git_commit', { message });
    return;
  }
  await httpPost('/api/git/commit', { message });
}

async function gitPush(): Promise<void> {
  if (isTauriAvailable()) {
    await invokeCommand('git_push');
    return;
  }
  await httpPost('/api/git/push');
}

async function gitPull(): Promise<void> {
  if (isTauriAvailable()) {
    await invokeCommand('git_pull');
    return;
  }
  await httpPost('/api/git/pull');
}

// ── Versions ─────────────────────────────────────────────────────────────────

interface NoteVersionMeta {
  id: string;
  notePath: string;
  label: string;
  timestamp: number;
  size: number;
}

async function listVersions(notePath: string): Promise<NoteVersionMeta[]> {
  if (isTauriAvailable()) return invokeCommand<NoteVersionMeta[]>('list_versions', { notePath });
  return httpGet(`/api/versions/${encodeURIComponent(notePath)}`);
}

async function createVersion(notePath: string, label?: string): Promise<NoteVersionMeta> {
  if (isTauriAvailable())
    return invokeCommand<NoteVersionMeta>('create_version', { notePath, label });
  return httpPost(`/api/versions/${encodeURIComponent(notePath)}`, { label });
}

async function readVersion(notePath: string, versionId: string): Promise<string> {
  if (isTauriAvailable()) return invokeCommand<string>('read_version', { notePath, versionId });
  return httpGet(
    `/api/version/${encodeURIComponent(notePath)}?id=${encodeURIComponent(versionId)}`
  );
}

// ── Backups ──────────────────────────────────────────────────────────────────

interface BackupMeta {
  path: string;
  sizeBytes: number;
  createdAt: number;
  noteCount: number;
}

async function listBackups(): Promise<{ backups: BackupMeta[] }> {
  if (isTauriAvailable()) return invokeCommand('list_backups');
  return httpGet('/api/backups');
}

async function createBackup(): Promise<BackupMeta> {
  if (isTauriAvailable()) return invokeCommand<BackupMeta>('create_backup');
  return httpPost('/api/backups');
}

async function deleteBackup(backupPath: string): Promise<void> {
  if (isTauriAvailable()) {
    await invokeCommand('delete_backup', { backupPath });
    return;
  }
  await httpDelete(`/api/backups/${encodeURIComponent(backupPath)}`);
}

// ── Smart Connections ────────────────────────────────────────────────────────

interface SmartConnection {
  path: string;
  title: string;
  score: number;
  snippet: string;
}

async function findSimilarNotes(
  notePath: string,
  limit = 10,
  minScore = 0.1
): Promise<SmartConnection[]> {
  if (isTauriAvailable())
    return invokeCommand<SmartConnection[]>('find_similar_notes', { notePath, limit, minScore });
  return httpGet(
    `/api/similar/${encodeURIComponent(notePath)}?limit=${limit}&min_score=${minScore}`
  );
}

async function findSimilarToText(
  query: string,
  limit = 10,
  minScore = 0.1
): Promise<SmartConnection[]> {
  if (isTauriAvailable())
    return invokeCommand<SmartConnection[]>('find_similar_to_text', { query, limit, minScore });
  return httpGet(
    `/api/similar-text?q=${encodeURIComponent(query)}&limit=${limit}&min_score=${minScore}`
  );
}

// ── MCP client helper ───────────────────────────────────────────────────────

export interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
}

export async function mcpCallTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<McpToolResult> {
  const res = await fetch(apiUrl('/mcp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

export async function mcpListTools(): Promise<Array<{ name: string; description: string }>> {
  const res = await fetch(apiUrl('/mcp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/list',
      params: {},
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result.tools;
}

// ── Deep-link URI builder ───────────────────────────────────────────────────

export function buildDeepLink(action: 'open' | 'search' | 'new' | 'vault', value?: string): string {
  const encoded = value ? encodeURIComponent(value) : '';
  switch (action) {
    case 'open':
      return `bismuth://open/${encoded}`;
    case 'search':
      return `bismuth://search/${encoded}`;
    case 'new':
      return `bismuth://new/${encoded}`;
    case 'vault':
      return 'bismuth://vault';
  }
}
