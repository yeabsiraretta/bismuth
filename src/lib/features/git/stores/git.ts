import { writable, derived } from 'svelte/store';
import { getCurrentBranch, getGitStatus, type FileStatus } from '../services/git';
import { log } from '@/utils/logger';

export interface GitStoreState {
  initialized: boolean;
  branch: string;
  files: FileStatus[];
  loading: boolean;
}

export const gitState = writable<GitStoreState>({
  initialized: false,
  branch: '',
  files: [],
  loading: false,
});

export const modifiedCount = derived(gitState, ($s) => $s.files.length);

/** Refresh git status from backend. */
export async function refreshGitStatus(): Promise<void> {
  gitState.update((s) => ({ ...s, loading: true }));
  try {
    const [branch, files] = await Promise.all([getCurrentBranch(), getGitStatus()]);
    gitState.set({ initialized: true, branch, files, loading: false });
  } catch (err) {
    log.warn('Git status refresh failed (repo may not exist)', { error: String(err) });
    gitState.update((s) => ({ ...s, loading: false }));
  }
}
