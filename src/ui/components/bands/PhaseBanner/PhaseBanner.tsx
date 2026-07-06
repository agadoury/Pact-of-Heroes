/**
 * <PhaseBanner>
 *
 * Thin ~3.5% band between opponent strip and dice tray. Displays the
 * PhaseDisplay text with tone-appropriate coloring and bracketing diamond
 * marks. Hosts the ActivityLog trigger button at the right edge.
 *
 * Bible reference: Part 2.6.
 */

import { clsx } from '@/ui/util/clsx'
import type { PhaseDisplay } from '@/ui/types/phase'
import type { Tone } from '@/ui/types/ui'
import { Icon } from '@/ui/components/atoms/Icon'
import s from './PhaseBanner.module.css'

export interface PhaseBannerProps {
  phase:            PhaseDisplay
  onOpenLog?:       () => void
  onOpenMenu?:      () => void
  activityPulse?:   boolean
  className?:       string
}

export function PhaseBanner({
  phase,
  onOpenLog,
  onOpenMenu,
  activityPulse,
  className,
}: PhaseBannerProps): JSX.Element {
  const { text, tone } = describe(phase)
  return (
    <div className={clsx(s.banner, s[`tone-${tone}`], className)}>
      {onOpenMenu ? (
        <button
          type="button"
          className={s.logTrigger}
          onClick={onOpenMenu}
          aria-label="Open match menu"
        >
          <Icon name="menu" size={12} />
        </button>
      ) : (
        <span className={s.diamond} aria-hidden="true">◆</span>
      )}
      <span className={s.text}>{text}</span>
      {onOpenLog ? (
        <button
          type="button"
          className={clsx(s.logTrigger, activityPulse && s.pulsing)}
          onClick={onOpenLog}
          aria-label="Open match log"
        >
          <Icon name="scroll-text" size={12} />
        </button>
      ) : (
        <span className={s.diamond} aria-hidden="true">◆</span>
      )}
    </div>
  )
}

function describe(phase: PhaseDisplay): { text: string; tone: Tone } {
  switch (phase.kind) {
    case 'roll':               return { text: `Roll · ${phase.current} of ${phase.total}`,  tone: 'gold' }
    case 'plan':               return { text: 'Plan · Cards or End Turn',                   tone: 'gold' }
    case 'rolling':            return { text: 'Rolling…',                                    tone: 'gold' }
    case 'resolving':          return { text: `Resolving · ${phase.abilityName}`,           tone: phase.tone }
    case 'defense':            return { text: 'Choose Your Defense',                        tone: 'ember' }
    case 'spend':              return { text: 'Spend Radiance?',                            tone: 'dawn' }
    case 'card':               return { text: `Card Played · ${phase.cardName}`,            tone: 'frost' }
    case 'trigger':            return { text: `${phase.triggerName} · Active`,              tone: 'frost' }
    case 'upkeep-tick':        return { text: `Upkeep · ${phase.statusName} ticks`,         tone: phase.tone }
    case 'upkeep-draw':        return { text: 'Upkeep · Draw',                              tone: 'gold' }
    case 'upkeep-cp-gain':     return { text: 'Upkeep · +1 CP',                             tone: 'gold' }
    case 'upkeep-deck-shuffle':return { text: 'Upkeep · Deck shuffled',                     tone: 'gold' }
    case 'opponent-turn':      return { text: `${cap(phase.heroName)}'s Turn · ${phase.phase}`, tone: 'ember' }
    case 'match-start':        return { text: `Match begins · ${cap(phase.opponentName)}`,  tone: 'gold' }
    case 'match-end':          return { text: `${cap(phase.winnerName)} prevails`,          tone: 'gold' }
    case 'lethal':             return { text: `Lethal · ${phase.abilityName}`,              tone: 'crimson' }
    case 'idle':               return { text: '',                                            tone: 'gold' }
  }
}

function cap(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default PhaseBanner
