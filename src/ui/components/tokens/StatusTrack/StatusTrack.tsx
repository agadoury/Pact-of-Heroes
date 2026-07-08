/**
 * <StatusTrack>
 *
 * Container for a strip's chips. Groups positive left / negative right
 * with a divider between them. Overflow "+N" indicator when total > maxVisible.
 *
 * Every chip is tappable — tapping opens a tooltip (via uiStore) that
 * explains the token's mechanics; tapping the same chip again (or the
 * tooltip itself) dismisses it.
 *
 * Bible reference: Part 4.6.
 */

import { clsx } from '@/ui/util/clsx'
import type { StatusToken } from '@/ui/types/status'
import { statusTooltip } from '@/ui/types/statusInfo'
import { useUIStore } from '@/ui/store/uiStore'
import { SignatureChip } from '../SignatureChip'
import { StatusChip } from '../StatusChip'
import type { SignatureChipEntry } from '@/ui/selectors/statusTrack'
import s from './StatusTrack.module.css'

export interface StatusTrackProps {
  positive:      StatusToken[]
  negative:      StatusToken[]
  signatures:    SignatureChipEntry[]
  overflowCount: number
  className?:    string
}

const STATUS_ID_BY_SIGNATURE = {
  frostbite: 'berserker:frostbite',
  cinder:    'pyromancer:cinder',
  verdict:   'lightbearer:verdict',
} as const

/** Open the mechanics tooltip for a chip; tapping the same chip while its
 *  tooltip is up dismisses it instead. */
function toggleStatusTooltip(effect: string, count: number | undefined, anchor: { x: number; y: number }): void {
  const { tooltipTarget, setTooltip } = useUIStore.getState()
  const content = statusTooltip(effect, count)
  const isSame =
    tooltipTarget?.content.kind === 'free-text'
    && content.kind === 'free-text'
    && tooltipTarget.content.title === content.title
  setTooltip(isSame ? null : { anchor, content })
}

export function StatusTrack({
  positive,
  negative,
  signatures,
  overflowCount,
  className,
}: StatusTrackProps): JSX.Element {
  return (
    <div className={clsx(s.track, className)}>
      {positive.length > 0 ? (
        <div className={clsx(s.group, s.positive)} data-valence="positive">
          {positive.map((t, i) => (
            <StatusChip
              key={`p-${i}`}
              effect={t.effect}
              count={t.count}
              onTap={(anchor) => toggleStatusTooltip(t.effect, t.count, anchor)}
            />
          ))}
        </div>
      ) : null}
      {negative.length > 0 ? (
        <div className={clsx(s.group, s.negative)} data-valence="negative">
          {signatures.map((sig, i) => (
            <SignatureChip
              key={`sig-${i}`}
              kind={sig.kind}
              count={sig.count}
              threshold={sig.threshold}
              onTap={(anchor) => toggleStatusTooltip(STATUS_ID_BY_SIGNATURE[sig.kind], sig.count, anchor)}
            />
          ))}
          {negative
            .filter(t => !isSignatureEffect(t.effect))
            .map((t, i) => (
              <StatusChip
                key={`n-${i}`}
                effect={t.effect}
                count={t.count}
                onTap={(anchor) => toggleStatusTooltip(t.effect, t.count, anchor)}
              />
            ))}
        </div>
      ) : null}
      {overflowCount > 0 ? (
        <span className={s.overflow}>+{overflowCount}</span>
      ) : null}
    </div>
  )
}

function isSignatureEffect(effect: string): boolean {
  return effect === 'berserker:frostbite' ||
         effect === 'pyromancer:cinder'   ||
         effect === 'lightbearer:verdict'
}

export default StatusTrack
