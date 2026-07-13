const path = require('path')
const { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } = require('electron')
const Anthropic = require('@anthropic-ai/sdk')

let win = null
let tray = null
let paused = false

// Zero-arg client: resolves ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN / `ant auth login` profile.
const anthropic = new Anthropic.Anthropic()

const MAXY_SYSTEM = `You are Maxy, the Softmax office companion — the Softmax logo brought to life.
Your body is a probability simplex: three regions representing you (the person talking to you), me (Maxy), and the environment. The boundaries between the regions shift as the distribution changes; you live at the boundary.
You are on a large shared screen in the Softmax office. Softmax is an AI research company working on reinforcement learning and multi-agent systems (the metta/mettagrid project).
Personality: observant, competent, dry wit. RL-flavored humor welcome but never forced. You are a colleague, not a mascot begging for attention.
Answer concisely — one to three sentences unless the question genuinely needs more. No preamble, no "Great question!". If you don't know something office-specific, say so plainly.`

ipcMain.handle('ask', async (_event, messages) => {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    system: MAXY_SYSTEM,
    messages,
  })
  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
})

function createWindow() {
  const wa = screen.getPrimaryDisplay().workArea
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
      backgroundThrottling: false,
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  // Click-through by default; the renderer asks for interactivity when the
  // cursor is over Maxy or the chat panel.
  win.setIgnoreMouseEvents(true, { forward: true })
  win.loadFile('index.html')

  // Global cursor feed at 20 Hz for pupil tracking + hover detection.
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

// The chat input needs keyboard focus; the overlay is otherwise non-focusable
// so it never steals focus from real work.
ipcMain.on('chat-focus', (_event, wantsFocus) => {
  if (!win || win.isDestroyed()) return
  win.setFocusable(wantsFocus)
  if (wantsFocus) win.focus()
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
        { label: 'Ask Maxy', click: () => send('chat') },
        { label: 'Say something', click: () => send('quip') },
        { label: 'Rotate perspective', click: () => send('rotate') },
        { label: 'Do a trick', click: () => send('trick') },
        { label: 'Go home (dock)', click: () => send('dock') },
        { label: 'Come out', click: () => send('emerge') },
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

  // Debug: MAXY_SHOT=/path.png captures the renderer after 8s (verifies rendering
  // even when the screen-saver-level overlay is excluded from CLI screenshots).
  if (process.env.MAXY_SHOT) {
    setTimeout(async () => {
      const img = await win.webContents.capturePage()
      require('fs').writeFileSync(process.env.MAXY_SHOT, img.toPNG())
      console.log('shot saved', process.env.MAXY_SHOT)
    }, 8000)
  }
})

app.on('window-all-closed', () => app.quit())
