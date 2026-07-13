import { invokeCommand } from '@/ipc/invoke';
import { isTauriAvailable } from '@/utils/platform';

export interface NoteVersion {
  id: string;
  notePath: string;
  label: string;
  timestamp: number;
  size: number;
}

function mockVersion(notePath: string, label?: string): NoteVersion {
  return {
    id: `v-${Date.now()}`,
    notePath,
    label: label ?? '',
    timestamp: Date.now(),
    size: 0,
  };
}

export function listVersions(notePath: string): Promise<NoteVersion[]> {
  if (!isTauriAvailable()) return Promise.resolve([]);
  return invokeCommand<NoteVersion[]>('list_versions', { notePath });
}

export function createVersion(notePath: string, label?: string): Promise<NoteVersion> {
  if (!isTauriAvailable()) return Promise.resolve(mockVersion(notePath, label));
  return invokeCommand<NoteVersion>('create_version', { notePath, label });
}

function readVersion(notePath: string, versionId: string): Promise<string> {
  if (!isTauriAvailable()) return Promise.resolve('');
  return invokeCommand<string>('read_version', { notePath, versionId });
}

function deleteVersion(notePath: string, versionId: string): Promise<void> {
  if (!isTauriAvailable()) return Promise.resolve();
  return invokeCommand<void>('delete_version', { notePath, versionId });
}
