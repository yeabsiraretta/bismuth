import { invokeCommand } from '@/ipc/invoke';

export interface GitStatus {
  branch: string;
  clean: boolean;
  staged: number;
  modified: number;
  untracked: number;
}

export function gitStatus(): Promise<GitStatus> {
  return invokeCommand<GitStatus>('git_status');
}

export function gitCommit(message: string): Promise<void> {
  return invokeCommand<void>('git_commit', { message });
}

export function gitPush(): Promise<void> {
  return invokeCommand<void>('git_push');
}

export function gitPull(): Promise<void> {
  return invokeCommand<void>('git_pull');
}

export function gitStageAll(): Promise<void> {
  return invokeCommand<void>('git_stage_all');
}
