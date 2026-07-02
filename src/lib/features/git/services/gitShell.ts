import { Command } from '@tauri-apps/plugin-shell';

export class GitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitError';
  }
}

const SHELL_META = /[;&|`$<>\\\n\r]/;

function validateRepoPath(repoPath: string): void {
  if (!repoPath || !repoPath.startsWith('/')) {
    throw new GitError(`Invalid repoPath: must be a non-empty absolute path`);
  }
  if (SHELL_META.test(repoPath)) {
    throw new GitError(`Invalid repoPath: contains shell metacharacters`);
  }
}

async function runGit(repoPath: string, args: string[]): Promise<string> {
  const cmd = Command.create('git', ['-C', repoPath, ...args]);
  const output = await cmd.execute();
  if (output.code !== 0) {
    throw new GitError(output.stderr || `git ${args[0]} failed`);
  }
  return output.stdout;
}

export async function runGitStatus(repoPath: string): Promise<string> {
  validateRepoPath(repoPath);
  return runGit(repoPath, ['status', '--porcelain']);
}

export async function runGitAdd(repoPath: string, files: string[]): Promise<void> {
  validateRepoPath(repoPath);
  if (files.length === 0) return;
  await runGit(repoPath, ['add', '--', ...files]);
}

export async function runGitCommit(repoPath: string, message: string): Promise<void> {
  validateRepoPath(repoPath);
  if (!message.trim()) throw new GitError('Commit message must not be empty');
  await runGit(repoPath, ['commit', '-m', message]);
}

export async function runGitLog(repoPath: string, limit: number): Promise<string> {
  validateRepoPath(repoPath);
  return runGit(repoPath, ['log', `--max-count=${limit}`, '--oneline']);
}

export async function runGitBranch(repoPath: string): Promise<string> {
  validateRepoPath(repoPath);
  return runGit(repoPath, ['branch', '--show-current']);
}

export async function runGitRevParse(repoPath: string): Promise<void> {
  validateRepoPath(repoPath);
  try {
    await runGit(repoPath, ['rev-parse', '--is-inside-work-tree']);
  } catch {
    throw new GitError('Not a git repository');
  }
}

export async function runGitRestore(repoPath: string, file: string): Promise<void> {
  validateRepoPath(repoPath);
  await runGit(repoPath, ['restore', '--staged', file]);
}
