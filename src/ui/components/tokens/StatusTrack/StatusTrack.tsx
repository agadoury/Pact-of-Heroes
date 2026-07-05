/**
 * <StatusTrack>
 *
 * Container for a strip's chips. Groups positive left / negative right
 * with a divider between them. Overflow "+N" indicator when total > maxVisible.
 *
 * Bible reference: Part 4.6.
 */

import { clsx } from '@/ui/util/clsx'
import type { StatusToken } from '@/ui/types/status'
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
            <StatusChip key={`p-${i}`} effect={t.effect} count={t.count} />
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
            />
          ))}
          {negative
            .filter(t => !isSignatureEffect(t.effect))
            .map((t, i) => (
              <StatusChip key={`n-${i}`} effect={t.effect} count={t.count} />
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
