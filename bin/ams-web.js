#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const serverBundle = path.join(projectRoot, 'dist-server', 'server.js');
const distIndex = path.join(projectRoot, 'dist', 'index.html');

// 1. Build server bundle if missing
if (!fs.existsSync(serverBundle)) {
  console.log('[AMS] Compiling backend server with esbuild...');
  const esbuildBin = path.join(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild'
  );
  spawnSync(
    esbuildBin,
    [
      'src/server/server.ts',
      '--bundle',
      '--platform=node',
      '--format=cjs',
      '--external:better-sqlite3',
      '--outfile=dist-server/server.js'
    ],
    { cwd: projectRoot, stdio: 'inherit', shell: true }
  );
}

// 2. Build frontend if missing
if (!fs.existsSync(distIndex)) {
  console.log('[AMS] Building web frontend with Vite...');
  const viteBin = path.join(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'vite.cmd' : 'vite'
  );
  spawnSync(
    viteBin,
    ['build', '--config', 'vite.config.mjs'],
    { cwd: projectRoot, stdio: 'inherit', shell: true }
  );
}

// 3. Resolve execution runtime
// Direct .exe on Windows avoids cmd.exe path quoting quirks
const directElectronExe = path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
const fallbackElectronBin = path.join(projectRoot, 'node_modules', '.bin', 'electron');

let executable = 'node';
let env = { ...process.env };
let useShell = false;

if (process.platform === 'win32' && fs.existsSync(directElectronExe)) {
  executable = directElectronExe;
  env.ELECTRON_RUN_AS_NODE = '1';
  useShell = false;
} else if (fs.existsSync(fallbackElectronBin)) {
  executable = fallbackElectronBin;
  env.ELECTRON_RUN_AS_NODE = '1';
  useShell = process.platform === 'win32';
}

env.PORT = process.env.AMS_PORT || '5002';

console.log('[AMS] Launching Asset Management System Web Server...');
const serverProcess = spawn(executable, [serverBundle], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: useShell
});

serverProcess.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code || 0);
});

process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});
