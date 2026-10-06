/* ============================================================================
 * sound.ts — EFECTOS DE SONIDO SINTETIZADOS (WebAudio, sin archivos)
 * ----------------------------------------------------------------------------
 * No hay MP3/OGG: cada sonido se genera con osciladores + ruido filtrado.
 * Ventajas: cero peso en la build (ideal para gh-pages) y latencia nula.
 *
 * ¿Prefieres samples reales? Mete los archivos en public/sfx/ y sustituye
 * estas funciones por `new Audio('/sfx/clink.mp3').play()` (ojo: gh-pages
 * sirve el repo en /<nombre-repo>/, usa rutas relativas './sfx/…').
 * ==========================================================================*/

let ctx: AudioContext | null = null
let muted = false

export const setMuted = (m: boolean) => { muted = m }

/** AudioContext perezoso: los navegadores exigen gesto del usuario antes. */
function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Buffer de ruido blanco reutilizable. */
function noise(a: AudioContext, dur: number): AudioBuffer {
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** Silbido de la moneda subiendo (ruido con barrido de banda). */
export function whoosh() {
  if (muted) return
  const a = ac(); if (!a) return
  const t = a.currentTime
  const src = a.createBufferSource(); src.buffer = noise(a, 0.5)
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4
  bp.frequency.setValueAtTime(480, t)
  bp.frequency.exponentialRampToValueAtTime(2800, t + 0.34)
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.1)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48)
  src.connect(bp); bp.connect(g); g.connect(a.destination)
  src.start(t); src.stop(t + 0.5)
}

/** Tintineo metálico al caer (dos parciales + chasquido de alta frecuencia). */
export function clink(strength = 1) {
  if (muted) return
  const a = ac(); if (!a) return
  const t = a.currentTime
  const s = Math.max(0.2, Math.min(1, strength))
  ;([[1780, 0.13, 0.26], [2670, 0.08, 0.2]] as const).forEach(([f0, vol, dec], i) => {
    const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f0
    const g = a.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol * s, t + 0.005 + i * 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec)
    o.connect(g); g.connect(a.destination)
    o.start(t); o.stop(t + dec + 0.05)
  })
  const n = a.createBufferSource(); n.buffer = noise(a, 0.04)
  const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5400
  const ng = a.createGain()
  ng.gain.setValueAtTime(0.05 * s, t)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  n.connect(hp); hp.connect(ng); ng.connect(a.destination)
  n.start(t)
}

/** Click corto para los botones de la interfaz. */
export function tick() {
  if (muted) return
  const a = ac(); if (!a) return
  const t = a.currentTime
  const o = a.createOscillator(); o.type = 'square'; o.frequency.value = 2200
  const g = a.createGain()
  g.gain.setValueAtTime(0.035, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035)
  o.connect(g); g.connect(a.destination)
  o.start(t); o.stop(t + 0.04)
}
