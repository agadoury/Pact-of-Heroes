/**
 * <SettingsScreen>
 *
 * Reduced motion toggle + audio placeholder + about section.
 *
 * Bible reference: Part 8.4.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/ui/store/uiStore'
import { Button } from '@/ui/components/atoms/Button'
import { AmbientBackdrop } from '@/ui/components/shared/AmbientBackdrop'
import { audio } from '@/audio/manager'
import { setMusicVolume as setBusMusicVolume } from '@/ui/util/ambientMusic'
import { clsx } from '@/ui/util/clsx'
import s from './SettingsScreen.module.css'

export function SettingsScreen(): JSX.Element {
  const navigate = useNavigate()
  const reducedMotion = useUIStore(u => u.reducedMotionOverride)
  const setReducedMotion = useUIStore(u => u.setReducedMotionOverride)
  const [sfxVolume, setSfxVolume] = useState<number>(audio.getSfxVolume())
  const [musicVolume, setMusicVolumeLocal] = useState<number>(audio.getMusicVolume())
  const [muted, setMuted] = useState<boolean>(audio.isMuted())

  const onSfxChange = (v: number) => {
    setSfxVolume(v)
    audio.setSfxVolume(v)
  }
  const onMusicChange = (v: number) => {
    setMusicVolumeLocal(v)
    audio.setMusicVolume(v)
    setBusMusicVolume(v)
  }
  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    audio.setMuted(next)
  }

  return (
    <div className={s.page}>
      <AmbientBackdrop tone="gold" intensity="low" />
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/')}>‹ Back</button>
        <div className={s.title}>Settings</div>
      </header>

      <section className={s.section}>
        <h2>Audio</h2>
        <div className={s.row}>
          <span className={s.label}>Muted</span>
          <button
            className={clsx(s.toggle, muted && s.on)}
            onClick={toggleMute}
          >
            {muted ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className={s.row}>
          <span className={s.label}>SFX Volume</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(sfxVolume * 100)}
            onChange={e => onSfxChange(Number(e.target.value) / 100)}
            className={s.slider}
          />
        </div>
        <div className={s.row}>
          <span className={s.label}>Music Volume</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(musicVolume * 100)}
            onChange={e => onMusicChange(Number(e.target.value) / 100)}
            className={s.slider}
          />
        </div>
      </section>

      <section className={s.section}>
        <h2>Display</h2>
        <div className={s.row}>
          <span className={s.label}>Reduced Motion</span>
          <div className={s.segmented}>
            {(['auto', 'on', 'off'] as const).map(v => (
              <button
                key={v}
                className={clsx(s.segment, reducedMotion === v && s.active)}
                onClick={() => setReducedMotion(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <h2>About</h2>
        <div className={s.about}>
          <div>Version 0.3 · 2026</div>
          <div>Pact of Heroes — a 1v1 dice-and-card duel.</div>
        </div>
      </section>

      <div className={s.actions}>
        <Button variant="default" onClick={() => navigate('/ui-preview')}>
          UI Preview
        </Button>
      </div>
    </div>
  )
}

export default SettingsScreen
