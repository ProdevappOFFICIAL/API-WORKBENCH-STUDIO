import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "./channels/ipc.channels";


contextBridge.exposeInMainWorld("api", {
  minimizeWindow: () => ipcRenderer.send(IPC_CHANNELS.MINIMIZE),
  closeWindow: () => ipcRenderer.send(IPC_CHANNELS.CLOSEWINDOW),
  checkWindows: () => ipcRenderer.send(IPC_CHANNELS.CHECK_WINDOWS),
  maximizeWindow: () => ipcRenderer.send(IPC_CHANNELS.MAXIMIZE),
  onFunctionFinished: (callback: (message: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.MAXIMIZED_STATUS, (_event, message) =>
      callback(message)
    );
  },
  platform: process.platform,
  version: process.versions.electron,
});
