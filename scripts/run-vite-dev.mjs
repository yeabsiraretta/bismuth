import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const vitePackageJsonPath = require.resolve('vite/package.json');
const viteBinPath = join(dirname(vitePackageJsonPath), 'bin', 'vite.js');
const args = process.argv.slice(2);

const child = spawn(process.execPath, [viteBinPath, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('[run-vite-dev] Failed to start vite:', error);
  process.exit(1);
});
