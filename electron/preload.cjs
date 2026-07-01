const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  callDeepSeek: (args) => ipcRenderer.invoke('call-deepseek', args)
});
