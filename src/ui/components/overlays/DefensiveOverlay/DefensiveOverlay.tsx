/**
 * <DefensiveOverlay>
 *
 * Modal picker for choosing a defense. inset covers dice tray + middle band
 * + self strip; hand + action bar remain interactive for Instant plays.
 *
 * Bible reference: Part 6.1.
 */

import { clsx } from '@/ui/util/clsx'
import type { DefensiveOption } from '@/ui/components/ladder/DefensiveRow'
import { DefensiveLadder } from '@/ui/components/ladder/DefensiveLadder'
import s from './DefensiveOverlay.module.css'

export interface IncomingDamageInfo {
  damage:      number
  sourceLabel: string
}

export interface DefensiveOverlayProps {
  active:      boolean
  incoming:    IncomingDamageInfo
  options:     DefensiveOption[]
  selectedId?: string | null
  onSelect:    (id: string) => void
  /** True when the incoming damage type cannot be defended against —
   *  the ladder is replaced by a brace notice (Instants still playable). */
  undefendable?: boolean
  className?:  string
}

export function DefensiveOverlay({
  active,
  incoming,
  options,
  selectedId,
  onSelect,
  undefendable = false,
  className,
}: DefensiveOverlayProps): JSX.Element | null {
  if (!active) return null
  return (
    <div className={clsx(s.overlay, className)} data-overlay="defensive">
      <div className={s.incoming}>
        <div className={s.eyebrow}>— Incoming —</div>
        <div className={s.damage}>{incoming.damage}</div>
        <div className={s.source}>{incoming.sourceLabel}</div>
      </div>
      {undefendable ? (
        <div className={s.undefendable}>
          <div className={s.undefendableTitle}>UNDEFENDABLE</div>
          <div className={s.undefendableHint}>
            No defense can answer this. Play an Instant from your hand — or brace for impact.
          </div>
        </div>
      ) : (
        <>
          <DefensiveLadder
            defenses={options}
            selectedId={selectedId ?? null}
            onSelect={onSelect}
          />
          <div className={s.footerHint}>
            A defense rolls its dice once — if the combo lands, its effect
            triggers. Instants in your hand can still be played.
          </div>
        </>
      )}
    </div>
  )
}

export default DefensiveOverlay
