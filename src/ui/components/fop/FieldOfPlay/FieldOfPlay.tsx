/**
 * <FieldOfPlay>
 *
 * Container for FOP cinematics. Reads the current scene from uiStore and
 * dispatches to the right content component. Handles the fade-in/hold/
 * fade-out overlay via the resolution phase state machine.
 *
 * Bible reference: Part 5.1.
 */

import { clsx } from '@/ui/util/clsx'
import type { FOPScene, ResolutionPhase } from '@/ui/types/fop'
import { AbilityNameDisplay } from '../AbilityNameDisplay'
import { DamageNumber } from '../DamageNumber'
import { EffectRows } from '../EffectRows'
import { ParticleField } from '../ParticleField'
import { ConsumeContent } from '../ConsumeContent'
import { DetonationContent } from '../DetonationContent'
import { UpkeepFOP } from '../UpkeepFOP'
import s from './FieldOfPlay.module.css'

export interface FieldOfPlayProps {
  active:     boolean
  scene:      FOPScene | null
  phase:      ResolutionPhase
  className?: string
}

export function FieldOfPlay({
  active,
  scene,
  phase,
  className,
}: FieldOfPlayProps): JSX.Element | null {
  if (!active || !scene) return null

  return (
    <div
      className={clsx(
        s.overlay,
        s[`tone-${toneOf(scene)}`],
        active && phase !== 'fade-out' && s.visible,
        phase === 'fade-out' && s.fading,
        className,
      )}
    >
      <ParticleField
        density={particleDensityFor(scene)}
        tone={toneOf(scene)}
      />
      <div className={s.content}>
        {scene.kind === 'ability' ? (
          <>
            <AbilityNameDisplay
              name={scene.data.abilityName}
              tone={scene.data.elementalTone}
              phase={phase}
            />
            {scene.data.damage != null && scene.data.damage > 0 ? (
              <DamageNumber
                value={scene.data.damage}
                variant={scene.data.isLethal ? 'crimson' : scene.data.damageVariant}
                size={scene.data.tier === 4 ? 'ultimate' : 'standard'}
                phase={phase}
              />
            ) : scene.data.damage === 0 ? (
              // A landed attack that dealt nothing — say so instead of a
              // giant meaningless "0".
              <div className={clsx(s.blocked, phase === 'damage-in' || phase === 'effects-in' || phase === 'holding' ? s.blockedVisible : undefined)}>
                Blocked
              </div>
            ) : null}
            <EffectRows effects={scene.data.effects} phase={phase} />
          </>
        ) : scene.kind === 'detonation' ? (
          <DetonationContent data={scene.data} phase={phase} />
        ) : scene.kind === 'consume' ? (
          <ConsumeContent data={scene.data} phase={phase} />
        ) : scene.kind === 'sub-event' ? (
          <UpkeepFOP data={scene.data} />
        ) : scene.kind === 'defense' ? (
          <>
            <AbilityNameDisplay
              name={scene.data.defenseName}
              tone="frost"
              phase={phase}
            />
            <DamageNumber
              value={scene.data.reduction}
              variant="heal"
              phase={phase}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}

function toneOf(scene: FOPScene): 'gold' | 'ember' | 'frost' | 'dawn' | 'crimson' | 'detonation' {
  switch (scene.kind) {
    case 'ability':     return scene.data.isLethal ? 'crimson' : scene.data.elementalTone
    case 'detonation':  return 'detonation'
    case 'consume':     return scene.data.consumed[0]?.kind === 'cinder' ? 'ember' :
                                scene.data.consumed[0]?.kind === 'verdict' ? 'dawn' : 'frost'
    case 'sub-event':   return 'gold'
    case 'defense':     return 'frost'
    case 'card-play':   return scene.data.tone === 'gold' ? 'gold' : scene.data.tone
    default:            return 'gold'
  }
}

function particleDensityFor(scene: FOPScene): 'low' | 'standard' | 'high' | 'burst' {
  if (scene.kind === 'detonation') return 'burst'
  if (scene.kind === 'ability' && scene.data.tier === 4) return 'high'
  if (scene.kind === 'consume' || scene.kind === 'sub-event') return 'low'
  return 'standard'
}

export default FieldOfPlay
