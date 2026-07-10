const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('maxyBridge', {
  onCursor: (fn) => ipcRenderer.on('cursor', (_e, p) => fn(p)),
  onCommand: (fn) => ipcRenderer.on('command', (_e, c) => fn(c)),
  setInteractive: (v) => ipcRenderer.send('interactive', v),
})
