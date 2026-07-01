import { log } from '@/utils/logger';
import {
  GitError,
  runGitStatus,
  runGitAdd,
  runGitCommit,
  runGitBranch,
  runGitRevParse,
  runGitRestore,
} from '../services/gitShell';

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'untracked';
}

export interface GitStatus {
  isGitRepo: boolean;
  branch: string;
  staged: FileChange[];
  unstaged: FileChange[];
  error: string | null;
}

function parseStatusCode(code: string): FileChange['status'] {
  switch (code) {
    case 'A':
      return 'added';
    case 'M':
      return 'modified';
    case 'D':
      return 'deleted';
    default:
      return 'untracked';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'added':
      return 'A';
    case 'modified':
      return 'M';
    case 'deleted':
      return 'D';
    case 'untracked':
      return '?';
    default:
      return '';
  }
}

export async function loadGitStatus(vaultRoot: string): Promise<GitStatus> {
  const result: GitStatus = { isGitRepo: false, branch: '', staged: [], unstaged: [], error: null };

  try {
    await runGitRevParse(vaultRoot);
    result.isGitRepo = true;
  } catch {
    return result;
  }

  try {
    result.branch = (await runGitBranch(vaultRoot)).trim();

    const statusOut = await runGitStatus(vaultRoot);
    for (const line of statusOut.split('\n')) {
      if (!line.trim()) continue;
      const indexCode = line[0];
      const workCode = line[1];
      const filePath = line.slice(3).trim();

      if (indexCode !== ' ' && indexCode !== '?') {
        result.staged.push({ path: filePath, status: parseStatusCode(indexCode) });
      }
      if (workCode !== ' ' && workCode !== '?') {
        result.unstaged.push({ path: filePath, status: parseStatusCode(workCode) });
      } else if (indexCode === '?' && workCode === '?') {
        result.unstaged.push({ path: filePath, status: 'untracked' });
      }
    }
  } catch (err) {
    result.error = err instanceof GitError ? err.message : 'Failed to read git status';
    log.error('GitPanel: failed to load status', err as Error);
  }
  return result;
}

export async function stageFile(vaultRoot: string, filePath: string): Promise<void> {
  await runGitAdd(vaultRoot, [filePath]);
}

export async function unstageFile(vaultRoot: string, filePath: string): Promise<void> {
  await runGitRestore(vaultRoot, filePath);
}

export async function commitChanges(vaultRoot: string, message: string): Promise<void> {
  await runGitCommit(vaultRoot, message);
}
