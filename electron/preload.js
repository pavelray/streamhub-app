const { contextBridge } = require("electron");

// Expose only safe, minimal APIs to the renderer process
contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  isElectron: true,
});
