import { app, BrowserWindow , dialog, ipcMain} from "electron";
import { join } from "path";
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as net from 'net';
import * as dgram from 'dgram';

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;
let nativeTransfer: any = null;
try {
  // Load native C++ module for high-performance transfers
  nativeTransfer = require('./native/transfer.node');
} catch (error) {
  console.log('Native module not found, using JavaScript fallback');
}

let discoverySocket: dgram.Socket | null = null;
let transferServers: Map<string, net.Server> = new Map();

// Performance monitoring
let performanceMetrics = {
  transferSpeed: 0,
  networkUtilization: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  activeConnections: 0
};

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

ipcMain.on("minimize", () => {
  mainWindow?.minimize();
});
ipcMain.on("maximize", () => {
  mainWindow?.maximize();
  if(mainWindow?.isMaximized)[
    mainWindow.getMaximumSize()
  ]
});

ipcMain.on("close", () => {
  mainWindow?.close();
});
// Prevent multiple instances of the app
const initializeNetworkServices = async (): Promise<void> => {
  try {
    // Start device discovery service
    await startDeviceDiscovery();
    
    // Initialize transfer server
    await initializeTransferServer();
    
    // Start performance monitoring
    startPerformanceMonitoring();
    
    // Initialize C++ transfer engine if available
    if (nativeTransfer) {
      await nativeTransfer.initialize();
    }
    
    mainWindow?.webContents.send('system-ready', {
      nativeAcceleration: !!nativeTransfer,
      networkInterfaces: getNetworkInterfaces(),
      systemInfo: getSystemInfo()
    });
  } catch (error) {
    console.error('Failed to initialize network services:', error);
  }
};

// Device discovery using UDP broadcast
const startDeviceDiscovery = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      discoverySocket = dgram.createSocket('udp4');
      
      discoverySocket.on('message', (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === 'blinknet-device') {
            mainWindow?.webContents.send('device-discovered', {
              id: data.deviceId,
              name: data.deviceName,
              ip: rinfo.address,
              port: data.port,
              capabilities: data.capabilities,
              signalStrength: calculateSignalStrength(rinfo.address)
            });
          }
        } catch (error) {
          console.error('Error processing discovery message:', error);
        }
      });

      discoverySocket.bind(8080, () => {
        discoverySocket?.setBroadcast(true);
        console.log('Discovery service started on port 8080');
        
        // Broadcast our presence
        broadcastPresence();
        setInterval(broadcastPresence, 5000);
        
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Broadcast device presence
const broadcastPresence = (): void => {
  if (!discoverySocket) return;

  const message = JSON.stringify({
    type: 'blinknet-device',
    deviceId: getDeviceId(),
    deviceName: os.hostname(),
    port: 8081,
    capabilities: {
      maxSpeed: nativeTransfer ? nativeTransfer.getMaxSpeed() : 100,
      compression: true,
      encryption: true,
      parallelStreams: os.cpus().length
    }
  });

  const interfaces = getNetworkInterfaces();
  interfaces.forEach(iface => {
    if (iface.broadcast) {
      discoverySocket?.send(message, 8080, iface.broadcast);
    }
  });
};

// Initialize high-performance transfer server
const initializeTransferServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.on('connection', (socket) => {
      console.log('New transfer connection:', socket.remoteAddress);
      handleTransferConnection(socket);
    });

    server.listen(8081, () => {
      console.log('Transfer server listening on port 8081');
      resolve();
    });

    server.on('error', reject);
  });
};

// Handle incoming transfer connections
const handleTransferConnection = (socket: net.Socket): void => {
  let transferId: string | null = null;
  let transferBuffer = Buffer.alloc(0);
  let expectedSize = 0;
  let receivedSize = 0;

  socket.on('data', async (data) => {
    try {
      if (!transferId) {
        // First packet contains metadata
        const metadata = JSON.parse(data.toString());
        transferId = metadata.transferId;
        expectedSize = metadata.size;
        
        mainWindow?.webContents.send('transfer-started', {
          id: transferId,
          filename: metadata.filename,
          size: expectedSize,
          sender: socket.remoteAddress
        });
        
        return;
      }

      // Accumulate transfer data
      transferBuffer = Buffer.concat([transferBuffer, data]);
      receivedSize += data.length;

      // Update progress
      const progress = (receivedSize / expectedSize) * 100;
      const speed = calculateTransferSpeed(receivedSize, Date.now());
      
      mainWindow?.webContents.send('transfer-progress', {
        id: transferId,
        progress,
        speed,
        received: receivedSize,
        total: expectedSize
      });

      // Check if transfer complete
      if (receivedSize >= expectedSize) {
        await completeTransfer(transferId, transferBuffer);
        socket.end();
      }
    } catch (error) {
      console.error('Transfer error:', error);
      socket.destroy();
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    if (transferId) {
      mainWindow?.webContents.send('transfer-error', {
        id: transferId,
        error: error.message
      });
    }
  });
};

// Complete transfer and save file
const completeTransfer = async (transferId: string, data: Buffer): Promise<void> => {
  try {
    // Use native C++ for high-speed file operations if available
    if (nativeTransfer) {
      await nativeTransfer.saveFile(transferId, data);
    } else {
      // Fallback to Node.js
      const downloadsPath = path.join(os.homedir(), 'Downloads');
      const filename = `blinknet_${transferId}.bin`;
      const filepath = path.join(downloadsPath, filename);
      
      await fs.promises.writeFile(filepath, data);
    }

    mainWindow?.webContents.send('transfer-complete', {
      id: transferId,
      success: true
    });
  } catch (error) {
    console.error('Failed to complete transfer:', error);
    mainWindow?.webContents.send('transfer-error', {
      id: transferId,
      error: error.message
    });
  }
};

// Performance monitoring
const startPerformanceMonitoring = (): void => {
  setInterval(() => {
    performanceMetrics = {
      transferSpeed: getCurrentTransferSpeed(),
      networkUtilization: getNetworkUtilization(),
      cpuUsage: getCPUUsage(),
      memoryUsage: getMemoryUsage(),
      activeConnections: transferServers.size
    };

    mainWindow?.webContents.send('performance-update', performanceMetrics);
  }, 1000);
};

// IPC Handlers
ipcMain.handle('start-transfer', async (event, { targetDevice, files }) => {
  try {
    const transferId = generateTransferId();
    
    if (nativeTransfer) {
      // Use C++ for high-performance transfer
      return await nativeTransfer.startTransfer(transferId, targetDevice, files);
    } else {
      // JavaScript fallback
      return await startJavaScriptTransfer(transferId, targetDevice, files);
    }
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
});

ipcMain.handle('get-system-info', () => {
  return getSystemInfo();
});

ipcMain.handle('get-network-interfaces', () => {
  return getNetworkInterfaces();
});

ipcMain.handle('optimize-system', async () => {
  try {
    if (nativeTransfer) {
      await nativeTransfer.optimizeSystem();
    }
    return { success: true };
  } catch (error) {
    console.error('System optimization failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    const files = await Promise.all(
      result.filePaths.map(async (filePath) => {
        const stats = await fs.promises.stat(filePath);
        return {
          path: filePath,
          name: path.basename(filePath),
          size: stats.size,
          type: path.extname(filePath)
        };
      })
    );
    return files;
  }
  return [];
});

// Utility functions
const getDeviceId = (): string => {
  // Generate unique device ID based on MAC address
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (iface) {
      for (const alias of iface) {
        if (!alias.internal && alias.mac !== '00:00:00:00:00:00') {
          return alias.mac.replace(/:/g, '');
        }
      }
    }
  }
  return Math.random().toString(36).substr(2, 9);
};

const getSystemInfo = () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    hostname: os.hostname(),
    nativeAcceleration: !!nativeTransfer
  };
};

const getNetworkInterfaces = () => {
  const interfaces = os.networkInterfaces();
  const result: any[] = [];
  
  for (const [name, iface] of Object.entries(interfaces)) {
    if (iface) {
      for (const alias of iface) {
        if (!alias.internal && alias.family === 'IPv4') {
          result.push({
            name,
            address: alias.address,
            netmask: alias.netmask,
            mac: alias.mac,
            broadcast: calculateBroadcast(alias.address, alias.netmask)
          });
        }
      }
    }
  }
  
  return result;
};

const calculateBroadcast = (ip: string, netmask: string): string => {
  const ipParts = ip.split('.').map(Number);
  const maskParts = netmask.split('.').map(Number);
  
  return ipParts.map((part, i) => part | (255 - maskParts[i])).join('.');
};

const calculateSignalStrength = (ip: string): number => {
  // Simplified signal strength calculation
  // In reality, this would use more sophisticated methods
  return Math.floor(Math.random() * 100);
};

const generateTransferId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getCurrentTransferSpeed = (): number => {
  // Implementation would track actual transfer speeds
  return performanceMetrics.transferSpeed;
};

const getNetworkUtilization = (): number => {
  // Implementation would monitor network interface utilization
  return Math.floor(Math.random() * 100);
};

const getCPUUsage = (): number => {
  // Implementation would calculate actual CPU usage
  return Math.floor(Math.random() * 100);
};

const getMemoryUsage = (): number => {
  const used = os.totalmem() - os.freemem();
  return (used / os.totalmem()) * 100;
};

const calculateTransferSpeed = (bytes: number, startTime: number): number => {
  const elapsed = (Date.now() - startTime) / 1000;
  return bytes / elapsed;
};

const startJavaScriptTransfer = async (transferId: string, targetDevice: any, files: any[]): Promise<any> => {
  // JavaScript fallback implementation
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(targetDevice.port, targetDevice.ip);
    
    socket.on('connect', () => {
      // Send metadata first
      const metadata = {
        transferId,
        filename: files[0].name,
        size: files[0].size
      };
      
      socket.write(JSON.stringify(metadata));
      
      // Then send file data
      const fileStream = fs.createReadStream(files[0].path);
      fileStream.pipe(socket);
      
      resolve({ transferId, status: 'started' });
    });

    socket.on('error', reject);
  });
};

const cleanup = (): void => {
  if (discoverySocket) {
    discoverySocket.close();
  }
  
  transferServers.forEach(server => {
    server.close();
  });
  
  if (nativeTransfer) {
    nativeTransfer.cleanup();
  }
};


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
