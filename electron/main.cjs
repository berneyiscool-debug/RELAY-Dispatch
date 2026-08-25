const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'RELAY Dispatch',
    icon: path.join(__dirname, 'icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load local file in production
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Keep the main window on the app: block navigation to remote content.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev
      ? url.startsWith('http://localhost:5173')
      : url.startsWith('file://');
    if (!allowed) {
      event.preventDefault();
    }
  });

  // New windows: allow the print helpers (about:blank) and in-app hash links,
  // send external links to the default browser instead of a child BrowserWindow.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url || url === 'about:blank' || url.startsWith('#')) {
      return { action: 'allow' };
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create a minimal default menu or customize it
  createMenu();
}

function createMenu() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About RELAY Dispatch',
          click: async () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              title: 'About RELAY Dispatch',
              message: 'RELAY Dispatch',
              detail: `Version: ${app.getVersion()}\nOffline-first field service management platform.`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  // Only check for updates in production
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Simple .env parser to read keys on startup
try {
  const fs = require('fs');
  const dotenvPath = path.join(__dirname, '../.env');
  if (fs.existsSync(dotenvPath)) {
    const dotenvContent = fs.readFileSync(dotenvPath, 'utf8');
    dotenvContent.split('\n').forEach(line => {
      const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (parts) {
        const key = parts[1];
        let val = parts[2] || '';
        // Remove surrounding quotes if any
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.warn('Failed to load local .env file in Electron main process:', e);
}

// The only hosts a local-mode AI call may reach. Never forward the user's key
// to an arbitrary URL — a compromised renderer could otherwise exfiltrate it.
const ALLOWED_AI_HOSTS = new Set(['api.deepseek.com', 'generativelanguage.googleapis.com']);

// IPC handler for DeepSeek API calls
ipcMain.handle('call-deepseek', async (event, { messages, endpoint, model, apiKey }) => {
  // Cloud accounts never reach this handler — their AI goes through the
  // `relay-copilot` edge function using the server-side DEEPSEEK_API_KEY secret.
  // This desktop path is only for local/offline accounts, which supply their own
  // key in Settings → AI. (The old process.env.VITE_DEEPSEEK_API_KEY fallback was
  // removed: the VITE_ prefix made Vite inline that key into the web bundle.)
  const key = apiKey;
  if (!key) {
    throw new Error('No AI API key configured. Add one in Settings → AI Assistant, or sign in to a cloud account to use the managed AI service.');
  }

  let target;
  try {
    target = new URL(endpoint || 'https://api.deepseek.com/chat/completions');
  } catch {
    throw new Error('Invalid AI endpoint URL.');
  }
  if (target.protocol !== 'https:' || !ALLOWED_AI_HOSTS.has(target.hostname)) {
    throw new Error('AI endpoint is not allowed.');
  }

  const response = await fetch(target.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: messages,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${text}`);
  }

  return await response.json();
});
