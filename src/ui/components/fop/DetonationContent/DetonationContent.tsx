/**
 * <DetonationContent>
 *
 * FOP scene for Cinder detonation — em-dash-bracketed label + burst-lined
 * cinder chips + AoE damage number.
 *
 * Bible reference: Part 5.7.
 */

import { clsx } from '@/ui/util/clsx'
import type { DetonationData, ResolutionPhase } from '@/ui/types/fop'
import { ConsumedToken } from '@/ui/components/tokens/ConsumedToken'
import { AbilityNameDisplay } from '../AbilityNameDisplay'
import { DamageNumber } from '../DamageNumber'
import s from './DetonationContent.module.css'

export interface DetonationContentProps {
  data:      DetonationData
  phase:     ResolutionPhase
  className?: string
}

export function DetonationContent({
  data,
  phase,
  className,
}: DetonationContentProps): JSX.Element {
  return (
    <div className={clsx(s.container, className)}>
      <AbilityNameDisplay
        name="— Detonation —"
        tone="ember"
        phase={phase}
      />
      <div className={s.row}>
        {Array.from({ length: data.stacksConsumed }, (_, i) => (
          <ConsumedToken key={i} kind="cinder" burst />
        ))}
      </div>
      <div className={s.arrow} aria-hidden="true">↓</div>
      <DamageNumber value={data.damage} variant="damage" phase={phase} />
      <div className={s.caption}>
        <span className={s.tokenName}>Cinder ×{data.stacksConsumed}</span>
        <span className={s.arrowGlyph}>→</span>
        <span className={s.gain}>
          {data.damage} {data.aoe ? 'AoE ' : ''}damage
        </span>
      </div>
    </div>
  )
}

export default DetonationContent
