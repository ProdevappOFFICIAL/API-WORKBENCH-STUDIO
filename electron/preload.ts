import { contextBridge, ipcRenderer } from 'electron';

// Expose minimal API to renderer process
contextBridge.exposeInMainWorld('api', {
  // Add only essential APIs here
  minimizeWindow: () => ipcRenderer.send('minimize'),
   closeWindow: () => ipcRenderer.send('close'),
  maximizeWindow: () => ipcRenderer.send('maximize'),
  platform: process.platform,
  version: process.versions.electron,
});