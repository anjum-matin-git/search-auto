// Simple proxy to run Vite dev server
import { spawn } from 'child_process';

const vite = spawn('npx', ['vite', 'dev', '--port', '5000'], {
  stdio: 'inherit',
  shell: true
});

vite.on('exit', (code) => {
  process.exit(code || 0);
});
