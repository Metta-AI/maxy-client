# Maxy

The Softmax logo, awakened. A living probability simplex that inhabits the office screen.

## Concept

Maxy's form *is* the Softmax mark, not a face pasted onto it. The three regions of the logo represent the three outcomes of the office distribution — **you / me / environment** — and the boundaries between them are redrawn every frame from an actual softmax over live logits:

- The **central boundary region** wiggles, expands, and contracts as the implied distribution shifts (`shiftDistribution` foregrounds one outcome and the bands rebalance).
- **Rotation** changes which outcome holds the middle/boundary — a change of perspective, shown as a full simplex rotation with relabeled bands.
- **Agitation** (thinking, being dragged, doing a trick) drives the wave amplitude and speed, so the geometry itself reads as alive and responsive.
- Eyes ride the top band and open only when Maxy is awake; there is no mouth — expression lives in the geometry.

## Emergence

The plain brand mark docks in the bottom-right corner. On activation (click the mark, or wait — Maxy self-activates), the mark pulses, Maxy takes form on top of it, opens its eyes, and separates from the mark, leaving a ghosted dock behind. When Maxy retreats (tray → "Go home", or sampled by its own policy), it glides back, closes its eyes, folds into the mark, and the brand returns to its normal state.

## Interaction

- **Click Maxy** → opens a lightweight "ask maxy" panel (Ink & Print styling). Questions go to Claude (`claude-opus-4-8`) with a Maxy persona; conversation history is kept for the session. `Esc` closes it.
- **Drag** to reposition. The simplex gets agitated, then settles.
- **Proactive but not needy**: one quiet observation every 7–13 minutes, suppressed while chatting or docked. No Clippy interruptions.
- **Tray (❊ maxy)**: Ask Maxy, Say something, Rotate perspective, Do a trick, Go home, Come out, Pause, Quit.

## Display

Sized for the big office monitor: 340px character, 20px speech text, high-contrast band boundaries that read from across the room.

## Run

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # required for the chat surface
npm start                              # foreground
npm run bg                             # background (logs to /tmp/maxy.log)
```

Without a key, everything works except chat (which reports "my weights are unreachable").

The overlay is transparent and click-through except over Maxy, the docked mark, and the open chat panel — the rest of the screen stays fully usable. The window is non-focusable except while typing in the chat input, so Maxy never steals keyboard focus.

### Debug

`MAXY_SHOT=/tmp/shot.png npm start` captures the renderer to a PNG after 8 seconds (useful because the screen-saver-level overlay is excluded from normal CLI screenshots).

## Architecture

- `main.js` — Electron shell: full-screen transparent overlay, global cursor feed (20 Hz), tray, focus management, and the `ask` IPC handler that calls the Anthropic API (zero-arg client; resolves `ANTHROPIC_API_KEY` or an `ant auth login` profile).
- `preload.js` — context-isolated bridge (`cursor`, `command`, `interactive`, `chat-focus`, `ask`).
- `index.html` — the character. A `requestAnimationFrame` loop redraws the three band paths every frame from `softmax(logits)` with eased transitions; behaviors mutate logits/agitation/roleOffset rather than swapping sprites. Behavior selection is itself a softmax over action logits.

No backend, no persistence; the only network call is the chat completion.
