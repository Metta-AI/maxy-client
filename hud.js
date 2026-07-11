// Shared viewership HUD — top-right of the overlay, in both the companion
// (index.html) and the battle arena (battle.html). Listens for `viewership`
// stats from the vision window (relayed by the main process) and renders a
// small, contextualized readout in the Softmax "Ink & Print" style.
//
// Design intent: never a bare number. We show the ratio as a percentage AND
// the raw attentive/occupancy fraction that produced it, plus a quiet label,
// so the figure always carries its own context. The panel stays hidden until
// vision is actually enabled, so it adds nothing when the camera is off.
;(function () {
  const bridge = window.maxyBridge
  if (!bridge || !bridge.onViewership) return

  const style = document.createElement('style')
  style.textContent = `
    #viewership {
      position: fixed;
      top: 14px;
      right: 16px;
      z-index: 9;
      min-width: 128px;
      padding: 9px 13px 10px;
      background: #fffaf0;
      border: 1px solid #e4dac8;
      border-radius: 10px;
      box-shadow: 0 3px 14px rgba(14, 39, 88, 0.10);
      color: #111827;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-6px);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }
    #viewership.show { opacity: 1; transform: translateY(0); }
    #viewership .vw-label {
      font: 600 10px ui-monospace, 'SF Mono', monospace;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #1a3875;
      margin-bottom: 3px;
    }
    #viewership .vw-main {
      display: flex;
      align-items: baseline;
      gap: 7px;
    }
    #viewership .vw-pct {
      font: 700 26px/1 Georgia, 'Iowan Old Style', serif;
      color: #0e2758;
    }
    #viewership .vw-frac {
      font: 13px Georgia, serif;
      color: #555555;
    }
    #viewership .vw-bar {
      margin-top: 7px;
      height: 5px;
      border-radius: 3px;
      background: #ece3d1;
      overflow: hidden;
    }
    #viewership .vw-bar > i {
      display: block;
      height: 100%;
      width: 0%;
      background: #859ebe;
      border-radius: 3px;
      transition: width 0.4s ease, background 0.4s ease;
    }
    #viewership.empty .vw-pct { color: #999999; }
    #viewership.offline .vw-label { color: #b36e4e; }
    #viewership .vw-note {
      margin-top: 5px;
      font: italic 11px Georgia, serif;
      color: #b36e4e;
      display: none;
    }
    #viewership.offline .vw-note { display: block; }
  `
  document.head.appendChild(style)

  const el = document.createElement('div')
  el.id = 'viewership'
  el.innerHTML = `
    <div class="vw-label">Watching</div>
    <div class="vw-main">
      <span class="vw-pct">–</span>
      <span class="vw-frac"></span>
    </div>
    <div class="vw-bar"><i></i></div>
    <div class="vw-note">camera unavailable</div>
  `
  document.body.appendChild(el)

  const pctEl = el.querySelector('.vw-pct')
  const fracEl = el.querySelector('.vw-frac')
  const barEl = el.querySelector('.vw-bar > i')

  bridge.onViewership((stats) => {
    if (!stats || stats.enabled === false) {
      el.classList.remove('show')
      return
    }
    el.classList.add('show')

    if (stats.ok === false) {
      el.classList.add('offline')
      el.classList.remove('empty')
      pctEl.textContent = '—'
      fracEl.textContent = ''
      barEl.style.width = '0%'
      return
    }
    el.classList.remove('offline')

    const occ = stats.occupancy | 0
    const att = stats.attentive | 0
    const pct = Math.round((stats.ratio || 0) * 100)

    if (occ === 0) {
      el.classList.add('empty')
      pctEl.textContent = '—'
      fracEl.textContent = 'room empty'
      barEl.style.width = '0%'
      return
    }
    el.classList.remove('empty')
    pctEl.textContent = pct + '%'
    fracEl.textContent = `${att}/${occ} eyes`
    barEl.style.width = pct + '%'
    // Warm the bar toward ink-navy as attention climbs.
    barEl.style.background = pct >= 60 ? '#0e2758' : '#859ebe'
  })
})()
