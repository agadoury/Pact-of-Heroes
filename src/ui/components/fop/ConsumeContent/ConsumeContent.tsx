/**
 * <ConsumeContent>
 *
 * FOP scene for signature-token consumption (Frost-bite → +damage,
 * Verdict → cleared via Atone).
 *
 * Bible reference: Part 5.6.
 */

import { clsx } from '@/ui/util/clsx'
import type { ConsumeData, ResolutionPhase } from '@/ui/types/fop'
import { ConsumedToken } from '@/ui/components/tokens/ConsumedToken'
import { AbilityNameDisplay } from '../AbilityNameDisplay'
import { DamageNumber } from '../DamageNumber'
import s from './ConsumeContent.module.css'

export interface ConsumeContentProps {
  data:      ConsumeData
  phase:     ResolutionPhase
  className?: string
}

export function ConsumeContent({ data, phase, className }: ConsumeContentProps): JSX.Element {
  const tokenLabel = data.consumed[0]?.kind ?? 'token'
  return (
    <div className={clsx(s.container, className)}>
      <AbilityNameDisplay name={data.abilityName} tone="frost" phase={phase} />
      <div className={s.row}>
        {data.consumed.map((t, i) => (
          <ConsumedToken key={i} kind={t.kind} />
        ))}
      </div>
      <div className={s.arrow} aria-hidden="true">↓</div>
      <DamageNumber
        value={data.finalValue}
        variant={data.variant === 'token-clear' ? 'resource' : 'damage'}
        phase={phase}
      />
      <div className={s.caption}>
        <span className={s.tokenName}>{titleCase(tokenLabel)} ×{data.consumed.length}</span>
        <span className={s.arrowGlyph}>→</span>
        <span className={s.gain}>
          {data.variant === 'token-clear'
            ? data.resultLabel
            : `+${data.consumed.length * data.bonusPerToken} ${data.resultLabel}`}
        </span>
      </div>
    </div>
  )
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default ConsumeContent
