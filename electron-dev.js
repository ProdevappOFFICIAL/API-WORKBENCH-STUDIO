const { spawn } = require('child_process');
const { createServer } = require('vite');
const electron = require('electron');

async function startElectronDev() {
  // Create Vite dev server
  const server = await createServer({
    configFile: './vite.config.ts'
  });
  
  await server.listen(5173);
  console.log('Vite dev server running on http://localhost:5173');

  // Start Electron
  const electronProcess = spawn(electron, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electronProcess.on('close', () => {
    server.close();
    process.exit();
  });
}

startElectronDev().catch(console.error);