/**
 * <Die>
 *
 * Single die renderer — face glyph (via DieFace.label) + number badge +
 * lock badge. Tumbling animation when isRolling.
 *
 * Bible reference: Part 2.7.
 */

import { clsx } from '@/ui/util/clsx'
import { Icon } from '@/ui/components/atoms/Icon'
import type { DieFace, HeroId } from '@/game/types'
import { HERO_ELEMENT } from '@/ui/types/ui'
import s from './Die.module.css'

export interface DieProps {
  face:          DieFace
  locked:        boolean
  isRolling?:    boolean
  rollDelay?:    number
  interactable?: boolean
  heroId?:       HeroId
  onTap?:        () => void
}

export function Die({
  face,
  locked,
  isRolling,
  rollDelay = 0,
  interactable = true,
  heroId,
  onTap,
}: DieProps): JSX.Element {
  const element = heroId ? HERO_ELEMENT[heroId] : 'frost'

  return (
    <button
      type="button"
      className={clsx(
        s.die,
        locked && s.locked,
        isRolling && s.rolling,
        !interactable && s.readonly,
        s[`element-${element}`],
      )}
      style={rollDelay ? { animationDelay: `${rollDelay}ms` } : undefined}
      onClick={interactable && !isRolling ? onTap : undefined}
      disabled={!interactable || isRolling}
      aria-label={`Die showing ${face.label}${locked ? ' (locked)' : ''}`}
      aria-pressed={locked}
    >
      <span className={s.number}>{face.faceValue}</span>
      <span className={s.glyph}>{face.label.charAt(0).toUpperCase()}</span>
      {locked ? (
        <span className={s.lockBadge} aria-hidden="true">
          <Icon name="lock" size={8} />
        </span>
      ) : null}
    </button>
  )
}

export default Die
