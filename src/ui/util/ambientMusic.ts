/**
 * Ambient music layer — synthesized drone pad + occasional chime.
 *
 * Pure WebAudio, no assets. Two slow-detuned oscillators + a soft filter
 * sweep create a "cathedral-at-dusk" bed that runs under menus + match.
 * Volume is bus-controlled through audio.setMusicVolume() so Settings can
 * dial it.
 *
 * Starts on first audio-unlock event. Idempotent — safe to call `start()`
 * multiple times.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let started = false
let musicVolume = 0.28
let muted = false

function ensureCtx(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : musicVolume
    master.connect(ctx.destination)
  }
  return ctx!
}

/** Slow-decay chime that fires at random ~15s intervals. */
function scheduleChime(delaySec: number) {
  if (!ctx || !master) return
  const c = ctx
  const m = master
  const t0 = c.currentTime + delaySec
  const notes = [523, 659, 784]           // C E G
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.15, t0 + 0.1)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 4)
  g.connect(m)
  notes.forEach((freq, i) => {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, t0 + i * 0.1)
    o.connect(g)
    o.start(t0 + i * 0.1); o.stop(t0 + 4.2)
  })
  window.setTimeout(() => scheduleChime(10 + Math.random() * 20), (delaySec + 4) * 1000)
}

export function start(): void {
  if (started) return
  started = true
  const c = ensureCtx()
  if (c.state === 'suspended') void c.resume()
  const t0 = c.currentTime
  const m = master!

  // Two low sines, slightly detuned — a drone.
  const bassG = c.createGain()
  bassG.gain.setValueAtTime(0.35, t0)
  bassG.connect(m)
  for (const freq of [65.4, 82.4]) {
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(freq, t0)
    o.detune.setValueAtTime(-8, t0)
    o.connect(bassG)
    o.start(t0)
  }
  // Higher shimmer — a soft filtered sine that slowly modulates.
  const filt = c.createBiquadFilter()
  filt.type = 'lowpass'
  filt.frequency.setValueAtTime(1400, t0)
  filt.Q.setValueAtTime(2, t0)
  const midG = c.createGain()
  midG.gain.setValueAtTime(0.13, t0)
  filt.connect(midG); midG.connect(m)
  for (const freq of [261.6, 329.6, 392.0]) {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, t0)
    o.connect(filt)
    o.start(t0)
  }
  // LFO on the filter cutoff — slow atmospheric breathing.
  const lfo = c.createOscillator()
  const lfoAmt = c.createGain()
  lfo.frequency.setValueAtTime(0.07, t0)
  lfoAmt.gain.setValueAtTime(500, t0)
  lfo.connect(lfoAmt); lfoAmt.connect(filt.frequency)
  lfo.start(t0)

  // Kick off the chime schedule.
  scheduleChime(6)
}

export function setMusicVolume(v: number): void {
  musicVolume = Math.max(0, Math.min(1, v))
  if (master && !muted) master.gain.value = musicVolume
}
export function setMusicMuted(m: boolean): void {
  muted = m
  if (master) master.gain.value = m ? 0 : musicVolume
}

if (typeof window !== 'undefined') {
  window.addEventListener('pact-of-heroes:audio-unlock', () => {
    try {
      const stored = localStorage.getItem('pact-of-heroes:audio:music')
      if (stored != null) musicVolume = Number(stored)
    } catch {}
    start()
  })
}
