import { contextBridge, ipcRenderer } from 'electron';

// Expose minimal API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Add only essential APIs here
  platform: process.platform,
  version: process.versions.electron,
});