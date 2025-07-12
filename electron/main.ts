import { app, BrowserWindow } from "electron";
import { join } from "path";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Prevent creating multiple windows
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,

    frame: false,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    },
    show: false,
    autoHideMenuBar: true,
    icon: undefined, // optional
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// Prevent multiple instances of the app

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
