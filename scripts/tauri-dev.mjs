import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const isLinux = process.platform === 'linux';
const packageManagerExec = process.env.npm_execpath;
const isJsExecpath = Boolean(packageManagerExec && /\.[mc]?js$/i.test(packageManagerExec));

const command = isLinux
  ? 'bash'
  : isJsExecpath
    ? process.execPath
    : process.platform === 'win32'
      ? 'pnpm.cmd'
      : 'pnpm';
const commandArgs = isLinux
  ? ['./scripts/tauri-dev.sh', ...args]
  : isJsExecpath
    ? [packageManagerExec, 'exec', 'tauri', 'dev', ...args]
    : ['exec', 'tauri', 'dev', ...args];

const child = spawn(command, commandArgs, { stdio: 'inherit' });

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('[tauri:dev] Failed to start command:', error);
  process.exit(1);
});
