import { invokeCommand } from '@/ipc/invoke';
import { isTauriAvailable } from '@/utils/platform';

export interface NoteResponse {
  path: string;
  title: string;
  content: string;
  modifiedAt: number;
  createdAt: number;
}

function mockNote(path: string, title: string, content = ''): NoteResponse {
  const now = Date.now();
  return { path, title, content, modifiedAt: now, createdAt: now };
}

export function readNote(path: string): Promise<NoteResponse> {
  if (!isTauriAvailable()) {
    const title = path.split('/').pop()?.replace('.md', '') ?? 'Untitled';
    return Promise.resolve(mockNote(path, title, `# ${title}\n\nStart writing here…`));
  }
  return invokeCommand<NoteResponse>('read_note', { path });
}

export function writeNote(path: string, content: string): Promise<void> {
  if (!isTauriAvailable()) return Promise.resolve();
  return invokeCommand<void>('write_note', { path, content });
}

export function deleteNote(path: string): Promise<void> {
  if (!isTauriAvailable()) return Promise.resolve();
  return invokeCommand<void>('delete_note', { path });
}

export async function createNote(
  title: string,
  folder?: string,
  content?: string
): Promise<NoteResponse> {
  if (!isTauriAvailable()) {
    const path = folder ? `${folder}/${title}.md` : `${title}.md`;
    return mockNote(path, title, content ?? '');
  }
  const note = await invokeCommand<NoteResponse>('create_note', { title, folder });
  if (content) {
    await writeNote(note.path, content);
    note.content = content;
  }
  return note;
}

export function renameNote(oldPath: string, newTitle: string): Promise<NoteResponse> {
  if (!isTauriAvailable()) {
    const dir = oldPath.split('/').slice(0, -1).join('/');
    const newPath = dir ? `${dir}/${newTitle}.md` : `${newTitle}.md`;
    return Promise.resolve(mockNote(newPath, newTitle));
  }
  return invokeCommand<NoteResponse>('rename_note', { oldPath, newTitle });
}
