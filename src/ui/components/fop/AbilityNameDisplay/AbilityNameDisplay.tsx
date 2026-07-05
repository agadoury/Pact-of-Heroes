/**
 * <AbilityNameDisplay>
 *
 * Ability name rendered at the top of the FOP scene during the name-in phase.
 *
 * Bible reference: Part 5.2.
 */

import { clsx } from '@/ui/util/clsx'
import type { Tone } from '@/ui/types/ui'
import type { ResolutionPhase } from '@/ui/types/fop'
import s from './AbilityNameDisplay.module.css'

export interface AbilityNameDisplayProps {
  name:      string
  tone:      Tone
  phase:     ResolutionPhase
  className?: string
}

const HIDDEN_PHASES: ResolutionPhase[] = ['idle', 'preconfirm', 'fade-in']

export function AbilityNameDisplay({
  name,
  tone,
  phase,
  className,
}: AbilityNameDisplayProps): JSX.Element {
  const visible = !HIDDEN_PHASES.includes(phase) && phase !== 'fade-out'
  return (
    <div
      className={clsx(
        s.name,
        s[`tone-${tone}`],
        visible ? s.visible : s.hidden,
        className,
      )}
    >
      {name}
    </div>
  )
}

export default AbilityNameDisplay
