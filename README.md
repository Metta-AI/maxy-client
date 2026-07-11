# Maxy

The Softmax logo, awakened. A Clippy-style desktop companion for the office screen.

## What

Maxy is the three-wave Softmax logo brought to life — eyes blink open on the light-blue crest, pupils track your cursor, and a behavior engine (an actual softmax over actions) drives RL-themed antics across your screen:

- **Gradient descent** — Maxy drops to the floor, bouncing to a local minimum
- **Cursor chasing** — reward-hacking the +1 when it catches you
- **Quips** — "Softmax: because argmax is a coward's choice."
- **ε-greedy teleport** — vanishes, explores a random screen location
- **NaN panic** — shakes violently when loss goes to NaN
- **Policy display** — shows the softmax distribution over its nine actions
- **Edge peek** — hides off-screen, peeks back with "Partially observable, never gone."
- **Logo hibernation** — face fades, returns to plain Softmax logo for a while, then reawakens
- **Entropy spin** — 720° maximum-entropy celebration
- **Ranged fire breath** — launches a fireball toward the cursor, exploding and dealing damage at a distance
- **Inferno geyser** — unleashes a rare screen-wide torrent that scorches and damages everything in its path
- **Sleep mode** — when the cursor goes idle for 2.5 minutes, Maxy dozes off (floating z's, breathing idle pose) until you move again

You can drag Maxy around (it complains about off-distribution states), click to poke it for a quip, and trigger tricks from the menu-bar tray. Speech bubbles use the Softmax Ink & Print design system (cream paper, ink navy, serif Georgia). The overlay is transparent and click-through everywhere except Maxy itself, so the rest of your screen stays fully usable.

## Run

```bash
npm install
npm start            # foreground
npm run bg           # background (logs to /tmp/maxy.log)
```

Runs on macOS (Electron 37). Linux/Windows should work with minor tweaks to the always-on-top / tray setup if needed.

The menu-bar tray (❊ maxy) has commands: _Say something_, _Do a trick_, _Gradient descent_, _Breathe fire_, _Inferno geyser_, _Show policy_, _Go incognito_, _Pause/Resume_, _Quit_.

### Battle mode

Set `MAXY_MODE=battle` to run the optimizer arena instead of the desktop companion. Fighters periodically unleash distinct specials: SGD sweeps the screen with a damaging tsunami, RMSPROP sprouts five collision-damage trees, MOMENTUM throws a three-snowball volley, ADAGRAD breathes ranged fireballs, and oLSTM fires a screen-wide inferno geyser that damages every living opponent. On multi-display Macs, set `MAXY_DISPLAY=left` or `MAXY_DISPLAY=right` to choose the screen.

Each fighter also cycles through two secondary powers: SGD uses Frost Nova and Smoke Bomb; ADAM uses Blink Strike and Shield Matrix; RMSPROP uses Healing Bloom and Thorn Armor; MOMENTUM uses Gravity Pulse and Overclock; ADAGRAD uses Ricochet Orb and Position Swap; and oLSTM uses Life Drain and Wall Cage. These twelve powers share a separate cooldown from weapons, specials, ultimates, and construction.

Movement personalities make the arena less predictable: SGD continuously flees from the other fighters, ADAM briefly cloaks while escaping, and ADAGRAD defensively teleports to the safest sampled screen position when an opponent gets too close.

Every fighter also builds temporary, projectile-blocking fortifications. Builders cycle through connected corners, gated corridors, zigzags, and three-sided forts to create a changing maze with intentional openings. Fighters steer toward the shortest wall endpoint instead of pressing into barriers, while non-oLSTM fighters preferentially fortify against the boss. The boss can smash through walls, ordinary projectiles damage and stop on impact, and walls expire automatically or clear between rounds.

The arena runs through a one-minute high-noon-to-deep-night cycle with an orbiting sun and moon, sharp dusk and dawn transitions, and a dense star field. Deep night is gameplay cover: distant, non-attacking fighters fade into the dark and disappear from oLSTM's target list until they approach or reveal themselves by attacking. Fighters also push farther away from oLSTM after dark. Every fighter has a second long-cooldown ultimate: chain lightning, time stop, earthquake, tornado, meteor storm, or black hole. Chatter combines contextual rival challenges, the normal companion's 18 shared comedy lines, and 100 additional personality-specific quotes spread across all six fighters.

The main-room setup can also run fully local speech interaction. Start each client with a distinct `MAXY_ECHO_PORT`, then run `./echo_start.sh`; the on-device transcriber posts recognized speech to both clients, where a random living fighter gives a short contextual response. Audio chunks and transcripts are discarded rather than stored. The listener expects Homebrew `ffmpeg` and `whisper-cli`, with its model at `~/maxy-echo/models/ggml-base.en.bin` by default.

## How it works

- **Electron shell** (`main.js`, `preload.js`) — transparent, frameless, always-on-top overlay covering the whole screen; click-through by default, becomes interactive only when the cursor hovers over Maxy
- **Character** (`index.html`) — the Softmax SVG plus a face (eyes with pupils, eyebrows, four mouth shapes), CSS animations (bob, waddle, breathe, shake), and a movement engine that lerps toward targets with lean/squash
- **Behavior engine** — softmax over eleven actions with tuned logits, sampled every 4–12 seconds; each action is an async function that moves, speaks, attacks, or changes pose/mood
- **Cursor feed** — main process polls the global cursor position at 20 Hz and sends it to the renderer so pupils can track (the overlay itself can't see the mouse because it's click-through)
- **Speech bubbles** — Ink & Print styled, 18-quip bag shuffled for variety, auto-hide after a few seconds
- **Tray integration** — macOS menu-bar icon with manual command triggers
- **Viewership vision** (opt-in) — a hidden window runs the camera through an on-device face detector and reports a live "who's watching" number to the overlay (see below)

No backend and no external network. State lives in the renderer; nothing is persisted. The optional vision feature uses the local camera but keeps every frame inside its own window — only small integers ever cross to the rest of the app.

## Viewership (camera CV pipeline)

Maxy can measure how much of the room is actually watching the screen and show it top-right as `WATCHING · 75% · 3/4 eyes`. It is **off by default** and only turns on when you ask for it, because it uses the camera.

Turn it on with the tray command **_Watch room (camera)_**, or start Maxy with it already enabled:

```bash
MAXY_VISION=1 npm start
```

### The metric

- **occupancy** — number of faces the detector sees in the frame (people in the room)
- **attentive** — faces that appear to be facing the screen ("eyes on it")
- **viewership** — `attentive / occupancy`, shown as a percentage alongside the raw `attentive/occupancy` fraction so the number always carries its context

> **Attention is a proxy, not true gaze.** v1 estimates *frontalness* — whether a head is turned toward the camera — from the detector's 6 face keypoints (eyes, nose, ears): a centered nose and symmetric ears score high, a turned head scores low. It does **not** track irises, so someone facing the screen with their eyes elsewhere still counts as attentive. It is a good, cheap signal for "the room is oriented at the screen," and the frontalness threshold is tunable (below). Iris-based gaze is the natural next step.

### How it works

- **`vision.html` + `vision-preload.js`** — a hidden `BrowserWindow` opens the camera via `getUserMedia` and runs Google **MediaPipe Tasks Vision** `FaceDetector` (BlazeFace short-range) on each video frame. It computes occupancy + attentive, exponentially smooths the ratio, and sends the small stats object to the main process. Frames never leave this window.
- **`main.js`** — spawns/tears down the vision window, prompts for macOS camera access, and relays the stats to the overlay over IPC.
- **`hud.js`** — a shared, Ink & Print–styled readout injected into both `index.html` and `battle.html`, pinned top-right. Hidden entirely while vision is off.
- **`vendor/mediapipe/`** — the MediaPipe WASM runtime and the ~230 KB BlazeFace model are vendored into the repo so the pipeline runs fully offline; no CDN, no download at runtime.

### Tuning

All optional; sensible defaults are baked in. Set before launch:

| Variable | Default | Meaning |
|---|---|---|
| `MAXY_VISION` | off | `1` to start with the camera on |
| `MAXY_VISION_DEBUG` | off | `1` shows the camera window with face boxes (green = attentive, orange = not) for tuning |
| `MAXY_VISION_ATTENTION` | `0.62` | frontalness threshold, 0–1, above which a face counts as attentive |
| `MAXY_VISION_MIN_CONFIDENCE` | `0.5` | detector confidence for a face to count toward occupancy |
| `MAXY_VISION_SMOOTHING` | `0.18` | EMA factor on the reported ratio (lower = steadier, higher = snappier) |
| `MAXY_VISION_REPORT_MS` | `400` | how often stats are pushed to the HUD |

### Extending

The stats object (`{ occupancy, attentive, ratio, ok }`) is intentionally shaped to feed a per-battle ranking later: in battle mode, partition attention by which fighter/region of the screen each frontal face is oriented toward, and rank battles by their share of the room's eyes.

## Extending

Add a new behavior:
1. Write an async function that moves/speaks/animates Maxy
2. Add it to the `ACTIONS` array in `index.html` with a logit (higher = sampled more often)
3. Optionally wire it to a tray command in the `COMMANDS` object

The mood API: `setMood('neutral' | 'excited' | 'worried' | 'asleep')` changes eyebrows + mouth.  
The pose API: `setPose('idle' | 'walking' | 'asleep' | 'panicking')` swaps the root animation.  
The speech API: `say(htmlString, durationMs)` shows a bubble, `floatText(text, className)` floats a small reward number.

## License

MIT — Softmax internal tool, open-sourced for vibes.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
