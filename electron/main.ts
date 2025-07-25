import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { join } from "path";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as net from "net";
import * as dgram from "dgram";
import { IPC_CHANNELS } from "./channels/ipc.channels";
import { pathConfig } from "./paths";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Prevent creating multiple windows
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    minWidth: 1200,
    minHeight: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
      devTools: true,
    },
    title: "API STUDIO",
    show: false,
    autoHideMenuBar: true,
    icon: 'resources/blinknet.ico' , // optional
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(pathConfig.DEVELOPNMENT_URL);
  } else {
    mainWindow.loadFile(join(__dirname, pathConfig.PRODUCTION_URL));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

ipcMain.on(IPC_CHANNELS.MINIMIZE, () => {
  mainWindow?.minimize();
});
ipcMain.on(IPC_CHANNELS.MAXIMIZE, () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
    mainWindow.getPosition();
  } else {
    mainWindow?.maximize();
  }
});

const checkWindows = () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.webContents.send(IPC_CHANNELS.MAXIMIZED_STATUS, "maximized");
  } else {
    mainWindow?.webContents.send(IPC_CHANNELS.MAXIMIZED_STATUS, "no-maximized");
  }
};
checkWindows();

ipcMain.on(IPC_CHANNELS.CHECK_WINDOWS, () => {
  checkWindows();
});

ipcMain.on(IPC_CHANNELS.CLOSEWINDOW, () => {
  mainWindow?.close();
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    //app.quit();
  }
});

app.on("activate", () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  // Also handle the newer 'window-open' event for Electron 12+
  contents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });
});
