import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const [subcommand] = args;
const isLinux = process.platform === 'linux';
const isDev = subcommand === 'dev';
const require = createRequire(import.meta.url);
const tauriPackageJsonPath = require.resolve('@tauri-apps/cli/package.json');
const tauriBinPath = join(dirname(tauriPackageJsonPath), 'tauri.js');

const command =
  isLinux && isDev
    ? 'bash'
    : process.execPath;
const commandArgs =
  isLinux && isDev
    ? ['./scripts/tauri-cli.sh', ...args]
    : [tauriBinPath, ...args];

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
