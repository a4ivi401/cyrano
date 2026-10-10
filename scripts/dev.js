const { createServer } = require('vite');
const esbuild = require('esbuild');
const { spawn } = require('child_process');
const path = require('path');

async function startDev() {
  // 1. Compile Main & Preload
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/main/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    outfile: path.join(__dirname, '../dist/main/index.js'),
    sourcemap: 'inline'
  });

  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/preload/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    outfile: path.join(__dirname, '../dist/preload/index.js'),
    sourcemap: 'inline'
  });

  // 2. Start Vite Dev Server
  const server = await createServer({
    configFile: path.join(__dirname, '../vite.config.ts')
  });
  await server.listen();

  const devUrl = 'http://localhost:5173';
  console.log(`[Vite] Server listening at ${devUrl}`);

  // 3. Start Electron
  const electronPath = require('electron');
  const electronProcess = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: devUrl
    }
  });

  electronProcess.on('close', () => {
    server.close();
    process.exit();
  });
}

startDev().catch((err) => {
  console.error(err);
  process.exit(1);
});
