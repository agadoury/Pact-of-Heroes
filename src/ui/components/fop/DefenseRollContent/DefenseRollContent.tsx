/**
 * <DefenseRollContent>
 *
 * The defense-roll cinematic: the defender's defense dice visibly tumble
 * (reusing the tray's <Die> choreography) and land on the engine-resolved
 * faces, then a landed/missed verdict slams in. Plays before the attack
 * impact scene so defense never reads as automatic.
 *
 * Bible reference: Part 5.10 (defense roll).
 */

import { useEffect, useState } from 'react'
import { clsx } from '@/ui/util/clsx'
import { getHero } from '@/content'
import type { DefenseRollData, ResolutionPhase } from '@/ui/types/fop'
import { AbilityNameDisplay } from '../AbilityNameDisplay'
import { Die } from '@/ui/components/bands/Die'
import { haptic } from '@/ui/util/haptics'
import s from './DefenseRollContent.module.css'

export interface DefenseRollContentProps {
  data:  DefenseRollData
  phase: ResolutionPhase
}

export function DefenseRollContent({ data, phase }: DefenseRollContentProps): JSX.Element {
  const faces = getHero(data.heroId).diceIdentity.faces

  // Throw the dice shortly after the scene mounts — <Die> tumbles on each
  // rising edge of rollSignal and lands on the real face we pass it.
  const [rollSignal, setRollSignal] = useState(0)
  useEffect(() => {
    const t = window.setTimeout(() => { setRollSignal(1); haptic('roll') }, 220)
    return () => window.clearTimeout(t)
  }, [])

  const verdictVisible = phase === 'damage-in' || phase === 'effects-in' || phase === 'holding'
  const verdict = data.landed
    ? (data.reduction > 0 ? `Blocks ${data.reduction}` : 'Combo landed')
    : 'Miss — no combo'

  return (
    <div className={s.wrap}>
      <AbilityNameDisplay name={data.defenseName} tone="frost" phase={phase} />
      <div className={s.subtitle}>Defense roll</div>
      <div className={s.diceRow}>
        {data.faceIndices.map((fi, i) => (
          <Die
            key={i}
            face={faces[fi] ?? faces[0]!}
            faces={faces}
            locked={false}
            rollSignal={rollSignal}
            rollDelay={i * 90}
            interactable={false}
            heroId={data.heroId}
          />
        ))}
      </div>
      <div
        className={clsx(
          s.verdict,
          verdictVisible && s.verdictIn,
          data.landed ? s.landed : s.missed,
        )}
        aria-live="polite"
      >
        {verdict}
      </div>
    </div>
  )
}

export default DefenseRollContent
