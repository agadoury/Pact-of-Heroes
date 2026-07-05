/**
 * <SettingsScreen>
 *
 * Reduced motion toggle + audio placeholder + about section.
 *
 * Bible reference: Part 8.4.
 */

import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/ui/store/uiStore'
import { Button } from '@/ui/components/atoms/Button'
import { clsx } from '@/ui/util/clsx'
import s from './SettingsScreen.module.css'

export function SettingsScreen(): JSX.Element {
  const navigate = useNavigate()
  const reducedMotion = useUIStore(u => u.reducedMotionOverride)
  const setReducedMotion = useUIStore(u => u.setReducedMotionOverride)

  return (
    <div className={s.page}>
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/')}>‹ Back</button>
        <div className={s.title}>Settings</div>
      </header>

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
          <div>Version 0.2 · 2026</div>
          <div>Rebuilt UI in progress.</div>
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
