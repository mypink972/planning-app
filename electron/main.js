import { app, shell, Menu, Tray } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess;
let isServerStarted = false;
let tray = null;

// Fonction pour créer un fichier de log
const logFile = app.isPackaged 
  ? path.join(app.getPath('userData'), 'app.log')
  : path.join(__dirname, '..', 'app.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
}

function createTray() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '..', 'build', 'icon.png');

  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ouvrir Planning',
      click: () => {
        shell.openExternal('http://localhost:3000');
      }
    },
    {
      label: 'Quitter',
      click: () => {
        if (serverProcess) {
          try {
            serverProcess.kill();
          } catch (e) {
            log(`Error killing server: ${e.message}`);
          }
        }
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Planning MTZ');
  tray.setContextMenu(contextMenu);
}

function startServer() {
  if (isServerStarted) return;
  
  const isPackaged = app.isPackaged;
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, 'server', 'index.js')
    : path.join(__dirname, '..', 'server', 'index.js');

  try {
    if (!fs.existsSync(serverPath)) {
      log(`Server file not found at: ${serverPath}`);
      return;
    }

    const nodePath = isPackaged ? process.execPath : 'node';
    
    serverProcess = spawn(nodePath, [serverPath], {
      cwd: isPackaged ? process.resourcesPath : path.join(__dirname, '..'),
      env: {
        ...process.env,
        NODE_PATH: isPackaged 
          ? path.join(process.resourcesPath, 'node_modules')
          : path.join(__dirname, '..', 'node_modules')
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
      log(`Server: ${data}`);
      if (data.includes('Server running on port 3000')) {
        isServerStarted = true;
        shell.openExternal('http://localhost:3000');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      log(`Server Error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      log(`Failed to start server: ${error.message}`);
      isServerStarted = false;
    });

    serverProcess.on('exit', (code, signal) => {
      log(`Server process exited with code ${code} and signal ${signal}`);
      isServerStarted = false;
    });

  } catch (error) {
    log(`Error starting server: ${error.message}`);
  }
}

// Empêcher l'application de se fermer quand toutes les fenêtres sont fermées
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('ready', () => {
  try {
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
    createTray();
    startServer();
  } catch (error) {
    log(`Error in ready event: ${error.message}`);
  }
});

// Gérer proprement la fermeture de l'application
app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {
      log(`Error killing server: ${e.message}`);
    }
  }
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`);
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {
      log(`Error killing server: ${e.message}`);
    }
  }
  app.quit();
});
