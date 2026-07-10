const path = require('path')
const http = require('http')
const { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } = require('electron')

let win = null
let tray = null
let paused = false
let echoServer = null

// Echo mode: a local-only HTTP receiver. The on-device transcriber POSTs
// recognized speech here and we hand it to the renderer, where a Maxy speaks
// it. Text is never stored, only relayed to the window and then dropped.
function startEchoServer() {
  const port = Number(process.env.MAXY_ECHO_PORT || 0)
  if (!port) return
  echoServer = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/echo') {
      res.writeHead(404).end()
      return
    }
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 4096) req.destroy()
    })
    req.on('end', () => {
      const text = body.toString().trim().slice(0, 240)
      if (text && win && !win.isDestroyed()) win.webContents.send('echo', text)
      res.writeHead(204).end()
    })
  })
  echoServer.on('error', (error) => console.log('echo server error:', error.message))
  echoServer.listen(port, '127.0.0.1', () => console.log('echo listening on 127.0.0.1:' + port))
}

function pickDisplay() {
  const pick = (process.env.MAXY_DISPLAY || 'primary').toLowerCase()
  const displays = screen.getAllDisplays()
  if (pick === 'left') return displays.reduce((a, b) => (a.bounds.x <= b.bounds.x ? a : b))
  if (pick === 'right') return displays.reduce((a, b) => (a.bounds.x >= b.bounds.x ? a : b))
  return screen.getPrimaryDisplay()
}

function createWindow() {
  const display = pickDisplay()
  console.log('maxy display:', process.env.MAXY_DISPLAY || 'primary', JSON.stringify(display.bounds))
  const wa = display.workArea
  win = new BrowserWindow({
    x: wa.x,
    y: wa.y,
    width: wa.width,
    height: wa.height,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  // Click-through by default; the renderer asks for interactivity when the
  // cursor is over Maxy so the rest of the screen stays fully usable.
  win.setIgnoreMouseEvents(true, { forward: true })
  win.loadFile(process.env.MAXY_MODE === 'battle' ? 'battle.html' : 'index.html')

  // Global cursor feed: the overlay is click-through, so the renderer can't
  // see the mouse on its own. 20 Hz is plenty for pupil tracking + chasing.
  setInterval(() => {
    if (!win || win.isDestroyed()) return
    const p = screen.getCursorScreenPoint()
    const b = win.getBounds()
    win.webContents.send('cursor', { x: p.x - b.x, y: p.y - b.y })
  }, 50)
}

ipcMain.on('interactive', (_event, wantsMouse) => {
  if (!win || win.isDestroyed()) return
  win.setIgnoreMouseEvents(!wantsMouse, { forward: true })
})

function send(cmd) {
  if (win && !win.isDestroyed()) win.webContents.send('command', cmd)
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty())
  tray.setTitle('❊ maxy')
  const rebuild = () => {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Say something', click: () => send('quip') },
        { label: 'Do a trick', click: () => send('trick') },
        { label: 'Gradient descent', click: () => send('gradient') },
        { label: 'Breathe fire', click: () => send('fireball') },
        { label: 'Inferno geyser', click: () => send('inferno') },
        { label: 'Show policy', click: () => send('policy') },
        { label: 'Go incognito', click: () => send('incognito') },
        { type: 'separator' },
        {
          label: paused ? 'Resume Maxy' : 'Pause Maxy',
          click: () => {
            paused = !paused
            send(paused ? 'pause' : 'resume')
            rebuild()
          },
        },
        { type: 'separator' },
        { label: 'Quit Maxy', click: () => app.quit() },
      ])
    )
  }
  rebuild()
}

app.whenReady().then(() => {
  if (app.dock) app.dock.hide()
  createWindow()
  createTray()
  startEchoServer()
})

app.on('window-all-closed', () => app.quit())
