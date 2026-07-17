import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const isLinux = process.platform === 'linux';

const command = isLinux ? 'bash' : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const commandArgs = isLinux
  ? ['./scripts/tauri-dev.sh', ...args]
  : ['exec', 'tauri', 'dev', ...args];

const child = spawn(command, commandArgs, { stdio: 'inherit' });

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('[tauri:dev] Failed to start command:', error);
  process.exit(1);
});
