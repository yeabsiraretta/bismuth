import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const [subcommand, ...rest] = args;
const isLinux = process.platform === 'linux';
const isDev = subcommand === 'dev';

const command =
  isLinux && isDev ? 'bash' : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const commandArgs =
  isLinux && isDev ? ['./scripts/tauri-cli.sh', ...args] : ['exec', 'tauri', ...args];

const child = spawn(command, commandArgs, { stdio: 'inherit' });

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('[tauri] Failed to start command:', error);
  process.exit(1);
});
