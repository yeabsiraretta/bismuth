import { spawn } from 'node:child_process';

const mode = process.argv[2];
const extraArgs = process.argv.slice(3);

if (mode !== 'dev' && mode !== 'build') {
  console.error('[run-vite-web] Usage: node ./scripts/run-vite-web.mjs <dev|build> [args...]');
  process.exit(1);
}

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const child = spawn(pnpmBin, ['exec', 'vite', mode, ...extraArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_RUNTIME_MODE: 'web',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('[run-vite-web] Failed to start vite:', error);
  process.exit(1);
});
