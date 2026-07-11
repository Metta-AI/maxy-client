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

Movement personalities make the arena less predictable: SGD continuously flees from the other fighters, ADAM briefly cloaks while escaping, and ADAGRAD defensively teleports to the safest sampled screen position when an opponent gets too close.

Every fighter also builds temporary, projectile-blocking walls. Non-oLSTM fighters preferentially fortify against the boss, turn every third segment to form maze-like pockets, and steer away from oLSTM behind their cover. The boss can smash through walls, while ordinary projectiles damage and stop on impact. Walls expire automatically and are cleared between rounds.

The arena runs through a one-minute day/night cycle with an orbiting sun and moon, dusk and dawn transitions, and a star field at night. Every fighter has a second long-cooldown ultimate: chain lightning, time stop, earthquake, tornado, meteor storm, or black hole. Fighters shout contextual challenges at nearby rivals and also reuse the normal companion's full 18-quote comedy rotation.

The main-room setup can also run fully local speech interaction. Start each client with a distinct `MAXY_ECHO_PORT`, then run `./echo_start.sh`; the on-device transcriber posts recognized speech to both clients, where a random living fighter gives a short contextual response. Audio chunks and transcripts are discarded rather than stored. The listener expects Homebrew `ffmpeg` and `whisper-cli`, with its model at `~/maxy-echo/models/ggml-base.en.bin` by default.

## How it works

- **Electron shell** (`main.js`, `preload.js`) — transparent, frameless, always-on-top overlay covering the whole screen; click-through by default, becomes interactive only when the cursor hovers over Maxy
- **Character** (`index.html`) — the Softmax SVG plus a face (eyes with pupils, eyebrows, four mouth shapes), CSS animations (bob, waddle, breathe, shake), and a movement engine that lerps toward targets with lean/squash
- **Behavior engine** — softmax over eleven actions with tuned logits, sampled every 4–12 seconds; each action is an async function that moves, speaks, attacks, or changes pose/mood
- **Cursor feed** — main process polls the global cursor position at 20 Hz and sends it to the renderer so pupils can track (the overlay itself can't see the mouse because it's click-through)
- **Speech bubbles** — Ink & Print styled, 18-quip bag shuffled for variety, auto-hide after a few seconds
- **Tray integration** — macOS menu-bar icon with manual command triggers

No backend, no network, no persistence — all state lives in the renderer process.

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
