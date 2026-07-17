import { titleFromPath, type TextNoteExtension } from '@/utils/file-kind';

const BROWSER_VAULT_PREFIX = 'browser://';

export interface BrowserVaultSelection {
  name: string;
  rootPath: string;
}

export interface BrowserNoteMeta {
  path: string;
  title: string;
  modifiedAt: number;
  createdAt: number;
  size: number;
}

export interface BrowserNoteResponse extends BrowserNoteMeta {
  content: string;
}

const activeHandles = new Map<string, FileSystemDirectoryHandle>();

function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

function toBrowserVaultPath(name: string): string {
  return `${BROWSER_VAULT_PREFIX}${encodeURIComponent(name)}`;
}

export function isBrowserVaultPath(path: string): boolean {
  return path.startsWith(BROWSER_VAULT_PREFIX);
}

function assertBrowserVaultSupport(): void {
  if (supportsDirectoryPicker()) return;
  throw new Error(
    'Browser vault access requires the File System Access API in a supported browser.'
  );
}

function getDirectoryPicker(): (options?: {
  id?: string;
  mode?: 'read' | 'readwrite';
}) => Promise<FileSystemDirectoryHandle> {
  assertBrowserVaultSupport();
  return window.showDirectoryPicker.bind(window) as typeof window.showDirectoryPicker;
}

function registerHandle(handle: FileSystemDirectoryHandle): BrowserVaultSelection {
  const rootPath = toBrowserVaultPath(handle.name);
  activeHandles.set(rootPath, handle);
  return { name: handle.name, rootPath };
}

async function requireHandle(rootPath: string): Promise<FileSystemDirectoryHandle> {
  const handle = activeHandles.get(rootPath);
  if (!handle) {
    throw new Error(
      'Browser vault handle is not available. Re-open the vault from the folder picker.'
    );
  }

  const permission = await handle.queryPermission({ mode: 'readwrite' });
  if (permission === 'granted') return handle;

  const requested = await handle.requestPermission({ mode: 'readwrite' });
  if (requested !== 'granted') {
    throw new Error('Browser vault permission was not granted.');
  }

  return handle;
}

function splitRelativePath(path: string): string[] {
  return path
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
}

async function resolveParentDirectory(
  root: FileSystemDirectoryHandle,
  path: string,
  create: boolean
): Promise<{ dir: FileSystemDirectoryHandle; fileName: string }> {
  const parts = splitRelativePath(path);
  const fileName = parts.pop();
  if (!fileName) throw new Error(`Invalid vault path: "${path}"`);

  let dir = root;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create });
  }

  return { dir, fileName };
}

async function resolveFileHandle(
  root: FileSystemDirectoryHandle,
  path: string,
  create = false
): Promise<FileSystemFileHandle> {
  const { dir, fileName } = await resolveParentDirectory(root, path, create);
  return dir.getFileHandle(fileName, { create });
}

async function getFileMeta(path: string, handle: FileSystemFileHandle): Promise<BrowserNoteMeta> {
  const file = await handle.getFile();
  return {
    path,
    title: titleFromPath(path),
    modifiedAt: file.lastModified,
    createdAt: file.lastModified,
    size: file.size,
  };
}

function buildNotePath(
  title: string,
  folder?: string,
  extension: TextNoteExtension = 'md'
): string {
  const safeTitle = title.trim();
  if (!safeTitle) throw new Error('Note title is required.');
  return folder ? `${folder}/${safeTitle}.${extension}` : `${safeTitle}.${extension}`;
}

export async function pickBrowserVaultDirectory(): Promise<BrowserVaultSelection | null> {
  const picker = getDirectoryPicker();
  const handle = await picker({ id: 'bismuth-vault', mode: 'readwrite' });
  return registerHandle(handle);
}

export async function openBrowserVault(rootPath: string): Promise<BrowserVaultSelection> {
  const handle = await requireHandle(rootPath);
  return { name: handle.name, rootPath };
}

export async function createBrowserVault(
  rootPath: string,
  name: string
): Promise<BrowserVaultSelection> {
  const selection = await openBrowserVault(rootPath);
  return { ...selection, name: name.trim() || selection.name };
}

export async function scanBrowserVault(rootPath: string): Promise<BrowserNoteMeta[]> {
  const root = await requireHandle(rootPath);
  const files: BrowserNoteMeta[] = [];

  async function visit(dir: FileSystemDirectoryHandle, prefix = ''): Promise<void> {
    for await (const entry of dir.values()) {
      const nextPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === 'directory') {
        await visit(entry, nextPath);
        continue;
      }
      files.push(await getFileMeta(nextPath, entry));
    }
  }

  await visit(root);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

export async function readBrowserNote(
  rootPath: string,
  path: string
): Promise<BrowserNoteResponse> {
  const root = await requireHandle(rootPath);
  const handle = await resolveFileHandle(root, path);
  const file = await handle.getFile();
  return {
    ...(await getFileMeta(path, handle)),
    content: await file.text(),
  };
}

export async function writeBrowserNote(
  rootPath: string,
  path: string,
  content: string
): Promise<void> {
  const root = await requireHandle(rootPath);
  const handle = await resolveFileHandle(root, path, true);
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function createBrowserNote(
  rootPath: string,
  title: string,
  folder?: string,
  content = '',
  extension: TextNoteExtension = 'md'
): Promise<BrowserNoteResponse> {
  const path = buildNotePath(title, folder, extension);
  await writeBrowserNote(rootPath, path, content);
  return readBrowserNote(rootPath, path);
}

export async function deleteBrowserNote(rootPath: string, path: string): Promise<void> {
  const root = await requireHandle(rootPath);
  const { dir, fileName } = await resolveParentDirectory(root, path, false);
  await dir.removeEntry(fileName);
}

export async function renameBrowserNote(
  rootPath: string,
  oldPath: string,
  newTitle: string
): Promise<BrowserNoteResponse> {
  const existing = await readBrowserNote(rootPath, oldPath);
  const segments = splitRelativePath(oldPath);
  const oldName = segments.pop();
  const folder = segments.join('/');
  const ext = oldName?.includes('.') ? oldName.split('.').pop() : 'md';
  const next = await createBrowserNote(
    rootPath,
    newTitle,
    folder || undefined,
    existing.content,
    (ext as TextNoteExtension | undefined) ?? 'md'
  );
  await deleteBrowserNote(rootPath, oldPath);
  return next;
}

export function clearBrowserVaultHandle(rootPath?: string): void {
  if (rootPath) {
    activeHandles.delete(rootPath);
    return;
  }
  activeHandles.clear();
}
