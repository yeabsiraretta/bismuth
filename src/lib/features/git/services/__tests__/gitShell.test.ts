import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GitError,
  runGitStatus,
  runGitAdd,
  runGitCommit,
  runGitLog,
  runGitBranch,
} from '../gitShell';

vi.mock('@tauri-apps/plugin-shell', () => ({
  Command: {
    create: vi.fn(),
  },
}));

const { Command } = await import('@tauri-apps/plugin-shell');

function mockCommand(stdout: string, stderr = '', code = 0) {
  const execute = vi.fn().mockResolvedValue({ stdout, stderr, code });
  vi.mocked(Command.create).mockReturnValue({ execute } as unknown as ReturnType<
    typeof Command.create
  >);
  return execute;
}

describe('gitShell', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runGitStatus calls git status --porcelain', async () => {
    mockCommand('M  src/foo.ts\n');
    const result = await runGitStatus('/vault');
    expect(Command.create).toHaveBeenCalledWith('git', ['-C', '/vault', 'status', '--porcelain']);
    expect(result).toContain('M  src/foo.ts');
  });

  it('runGitAdd calls git add with files', async () => {
    mockCommand('');
    await runGitAdd('/vault', ['foo.ts', 'bar.ts']);
    expect(Command.create).toHaveBeenCalledWith('git', [
      '-C',
      '/vault',
      'add',
      '--',
      'foo.ts',
      'bar.ts',
    ]);
  });

  it('runGitAdd is a no-op for empty file list', async () => {
    await runGitAdd('/vault', []);
    expect(Command.create).not.toHaveBeenCalled();
  });

  it('runGitCommit calls git commit -m', async () => {
    mockCommand('');
    await runGitCommit('/vault', 'feat: add thing');
    expect(Command.create).toHaveBeenCalledWith('git', [
      '-C',
      '/vault',
      'commit',
      '-m',
      'feat: add thing',
    ]);
  });

  it('runGitCommit throws GitError for empty message', async () => {
    await expect(runGitCommit('/vault', '')).rejects.toBeInstanceOf(GitError);
  });

  it('runGitLog calls git log --max-count', async () => {
    mockCommand('abc1234 feat: init\n');
    const result = await runGitLog('/vault', 5);
    expect(Command.create).toHaveBeenCalledWith('git', [
      '-C',
      '/vault',
      'log',
      '--max-count=5',
      '--oneline',
    ]);
    expect(result).toContain('feat: init');
  });

  it('runGitBranch calls git branch --show-current', async () => {
    mockCommand('main\n');
    const result = await runGitBranch('/vault');
    expect(Command.create).toHaveBeenCalledWith('git', [
      '-C',
      '/vault',
      'branch',
      '--show-current',
    ]);
    expect(result.trim()).toBe('main');
  });

  it('throws GitError when repoPath is empty', async () => {
    await expect(runGitStatus('')).rejects.toBeInstanceOf(GitError);
  });

  it('throws GitError when git exits non-zero', async () => {
    mockCommand('', 'fatal: not a git repo', 128);
    await expect(runGitStatus('/notarepo')).rejects.toBeInstanceOf(GitError);
  });
});
