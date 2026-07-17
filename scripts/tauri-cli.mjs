import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const [subcommand] = args;
const isLinux = process.platform === 'linux';
const isDev = subcommand === 'dev';
const packageManagerExec = process.env.npm_execpath;
const isJsExecpath = Boolean(packageManagerExec && /\.[mc]?js$/i.test(packageManagerExec));

const command =
  isLinux && isDev
    ? 'bash'
    : isJsExecpath
      ? process.execPath
      : process.platform === 'win32'
        ? 'pnpm.cmd'
        : 'pnpm';
const commandArgs =
  isLinux && isDev
    ? ['./scripts/tauri-cli.sh', ...args]
    : isJsExecpath
      ? [packageManagerExec, 'exec', 'tauri', ...args]
      : ['exec', 'tauri', ...args];

const child = spawn(command, commandArgs, { stdio: 'inherit' });

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('[tauri] Failed to start command:', error);
  process.exit(1);
});
