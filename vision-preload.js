const { contextBridge, ipcRenderer } = require('electron')

// Bridge for the hidden vision window. It runs the camera + face detector and
// reports viewership stats up to the main process, which relays them to the
// overlay. No frames or images ever leave this window — only small numbers.
contextBridge.exposeInMainWorld('visionBridge', {
  sendStats: (stats) => ipcRenderer.send('vision-stats', stats),
  log: (msg) => ipcRenderer.send('vision-log', String(msg)),
})
