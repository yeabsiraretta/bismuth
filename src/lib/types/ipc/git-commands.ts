/**
 * Git IPC Commands — Version control operations
 */

interface CommandContract<P, R> { params: P; result: R }

interface FileStatus { path: string; status: string }
interface CommitEntry { hash: string; message: string; author: string; timestamp: number }

export interface GitCommands {
  initialize_git_service: CommandContract<{ path: string }, void>;
  git_current_branch: CommandContract<Record<string, never>, string>;
  git_list_branches: CommandContract<Record<string, never>, string[]>;
  git_status: CommandContract<Record<string, never>, FileStatus[]>;
  git_add: CommandContract<{ paths: string[] }, void>;
  git_commit: CommandContract<{ message: string }, string>;
  git_log: CommandContract<{ limit: number }, CommitEntry[]>;
}
