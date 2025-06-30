"use strict";require("electron").contextBridge.exposeInMainWorld("electronAPI",{platform:process.platform,version:process.versions.electron});
