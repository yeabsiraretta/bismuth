import { ipcCall } from '@/utils/ipc';
import { log } from '@/utils/logger';

export interface FileStatus {
  path: string;
  status: string;
}

export interface CommitEntry {
  sha: string;
  message: string;
  author: string;
  timestamp: number;
}

/** Initialize the git service for a vault. Returns true if repo exists. */
export async function initializeGitService(vaultRoot: string): Promise<boolean> {
  try {
    return await ipcCall<boolean>('initialize_git_service', { vaultRoot });
  } catch (err) {
    log.error('Failed to initialize git service', err as Error);
    return false;
  }
}

/** Get the current branch name. */
export async function getCurrentBranch(): Promise<string> {
  return ipcCall<string>('git_current_branch');
}

/** List all local branches. */
export async function listBranches(): Promise<string[]> {
  return ipcCall<string[]>('git_list_branches');
}

/** Get status of modified/staged/untracked files. */
export async function getGitStatus(): Promise<FileStatus[]> {
  return ipcCall<FileStatus[]>('git_status');
}

/** Stage files for commit. */
export async function gitAdd(paths: string[]): Promise<void> {
  return ipcCall<void>('git_add', { paths });
}

/** Create a commit. */
export async function gitCommit(message: string): Promise<string> {
  return ipcCall<string>('git_commit', { message });
}

/** Get recent commit log. */
export async function getGitLog(limit: number = 20): Promise<CommitEntry[]> {
  return ipcCall<CommitEntry[]>('git_log', { limit });
}
