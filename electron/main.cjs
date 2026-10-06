const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;
// Set while an update check was started from the Help menu, so failures and
// "no update available" are reported to the user instead of only logged.
let manualUpdateCheck = false;

function isDevBuild() {
  return !app.isPackaged || process.env.NODE_ENV === 'development';
}

function showMessage(options) {
  const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
  return win ? dialog.showMessageBox(win, options) : dialog.showMessageBox(options);
}

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
    },
  });

  const isDev = isDevBuild();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load local file in production
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Keep the main window on the app: block navigation to remote content, but
  // hand real web links (Stripe checkout, password reset, invite links) to the
  // default browser so they still work from the desktop build.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = isDev
      ? url.startsWith('http://localhost:5173')
      : url.startsWith('file://');
    if (allowed) {
      return;
    }
    event.preventDefault();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
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
  const isDev = isDevBuild();

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
          label: 'Check for Updates…',
          click: () => checkForUpdates({ userInitiated: true })
        },
        { type: 'separator' },
        {
          label: 'About RELAY Dispatch',
          click: () => {
            showMessage({
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

function checkForUpdates({ userInitiated = false } = {}) {
  if (!app.isPackaged) {
    if (userInitiated) {
      showMessage({
        title: 'Check for Updates',
        message: 'Updates are only available in the installed app.',
        detail: `This is a development build (version ${app.getVersion()}).`,
        buttons: ['OK']
      });
    }
    return;
  }

  manualUpdateCheck = userInitiated;
  autoUpdater.checkForUpdates().catch((error) => {
    // The 'error' handler below reports this to the user when relevant.
    console.error('Update check failed:', error);
  });
}

function setupAutoUpdates() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    console.log(`Update ${info.version} found, downloading…`);
  });

  autoUpdater.on('update-not-available', () => {
    if (!manualUpdateCheck) {
      return;
    }
    manualUpdateCheck = false;
    showMessage({
      title: 'Check for Updates',
      message: 'RELAY Dispatch is up to date.',
      detail: `Version ${app.getVersion()} is the latest version.`,
      buttons: ['OK']
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('Update check failed:', error);
    if (!manualUpdateCheck) {
      return;
    }
    manualUpdateCheck = false;
    showMessage({
      type: 'error',
      title: 'Check for Updates',
      message: 'Could not check for updates.',
      detail: `${(error && error.message) || error}\n\nYou can download the latest installer from\nhttps://github.com/berneyiscool-debug/RELAY-Dispatch/releases/latest`,
      buttons: ['OK']
    });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    manualUpdateCheck = false;
    const { response } = await showMessage({
      title: 'Update Ready',
      message: `RELAY Dispatch ${info.version} is ready to install.`,
      detail: 'The update installs automatically when you close the app.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1
    });
    if (response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();

  // Only check for updates in production; the Help menu can check on demand.
  if (app.isPackaged) {
    checkForUpdates();
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
