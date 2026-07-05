/**
 * <SpendOverlay>
 *
 * Radiance spend prompt. Shows available count + spend options.
 *
 * Bible reference: Part 6.2.
 */

import { clsx } from '@/ui/util/clsx'
import s from './SpendOverlay.module.css'

export interface SpendOption {
  id:         string
  cost:       number
  name:       string
  effect:     string
  affordable: boolean
}

export interface SpendOverlayProps {
  active:        boolean
  resourceName:  string
  available:     number
  max:           number
  options:       SpendOption[]
  selectedId?:   string | null
  onSelect:      (id: string) => void
  className?:    string
}

export function SpendOverlay({
  active,
  resourceName,
  available,
  max,
  options,
  selectedId,
  onSelect,
  className,
}: SpendOverlayProps): JSX.Element | null {
  if (!active) return null
  return (
    <div className={clsx(s.overlay, className)}>
      <div className={s.title}>— {resourceName} Available —</div>
      <div className={s.available}>
        <span className={s.value}>{available}</span>
        <span className={s.max}>/ {max}</span>
      </div>
      <div className={s.options}>
        {options.map(opt => (
          <button
            type="button"
            key={opt.id}
            className={clsx(
              s.option,
              !opt.affordable && s.unaffordable,
              selectedId === opt.id && s.selected,
            )}
            disabled={!opt.affordable}
            onClick={() => onSelect(opt.id)}
          >
            <span className={s.cost}>{opt.cost}</span>
            <div className={s.optInfo}>
              <div className={s.optName}>{opt.name}</div>
              <div className={s.optEffect}>{opt.effect}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SpendOverlay
