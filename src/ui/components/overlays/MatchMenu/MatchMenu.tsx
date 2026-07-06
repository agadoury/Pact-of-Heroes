/**
 * <MatchMenu>
 *
 * In-match pause menu — the only escape hatch from a running match.
 * Resume / Concede / Return Home (match stays saved for Resume Match).
 * Without it a PWA player (no browser chrome) is trapped in the match.
 *
 * Bible reference: Part 2.6 (banner controls), Part 7.10 (persistence).
 */

import { clsx } from '@/ui/util/clsx'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import s from './MatchMenu.module.css'

export interface MatchMenuProps {
  active:     boolean
  onResume:   () => void
  onConcede:  () => void
  onGoHome:   () => void
  className?: string
}

export function MatchMenu({
  active,
  onResume,
  onConcede,
  onGoHome,
  className,
}: MatchMenuProps): JSX.Element | null {
  if (!active) return null
  return (
    <div
      className={clsx(s.overlay, className)}
      data-overlay="match-menu"
      onClick={(e) => e.target === e.currentTarget && onResume()}
    >
      <div className={s.panel}>
        <div className={s.header}>
          <span className={s.eyebrow}>— Paused —</span>
          <button type="button" className={s.close} onClick={onResume} aria-label="Resume">
            <Icon name="cross" size={12} />
          </button>
        </div>
        <div className={s.buttons}>
          <Button variant="primary" onClick={onResume} weight={0}>
            Resume
          </Button>
          <Button variant="default" onClick={onGoHome} weight={0}>
            Save &amp; Return Home
          </Button>
          <Button variant="crimson" onClick={onConcede} weight={0}>
            Concede Match
          </Button>
        </div>
        <div className={s.hint}>
          A saved match can be resumed from the home screen.
        </div>
      </div>
    </div>
  )
}

export default MatchMenu
