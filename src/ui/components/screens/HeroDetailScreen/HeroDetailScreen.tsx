/**
 * <HeroDetailScreen>
 *
 * Full hero info — signature mechanic, all abilities per tier, deck preview.
 *
 * Bible reference: Part 8.6.
 */

import { useNavigate, useParams } from 'react-router-dom'
import { getHero } from '@/content'
import type { HeroId, AbilityDef } from '@/game/types'
import { Button } from '@/ui/components/atoms/Button'
import { TierBadge } from '@/ui/components/ladder/TierBadge'
import s from './HeroDetailScreen.module.css'

export function HeroDetailScreen(): JSX.Element {
  const navigate = useNavigate()
  const { heroId } = useParams<{ heroId: HeroId }>()
  if (!heroId) return <NotFound onBack={() => navigate('/heroes')} />
  let hero
  try { hero = getHero(heroId) } catch { return <NotFound onBack={() => navigate('/heroes')} /> }

  const byTier: Partial<Record<1 | 2 | 3 | 4, AbilityDef[]>> = {}
  for (const abil of hero.abilityCatalog) {
    if (abil.tier === 1 || abil.tier === 2 || abil.tier === 3 || abil.tier === 4) {
      (byTier[abil.tier] ||= []).push(abil)
    }
  }

  return (
    <div className={s.page} style={{ ['--accent' as string]: hero.accentColor }}>
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/heroes')}>‹ Back</button>
        <div className={s.title}>{hero.name}</div>
      </header>

      <section className={s.hero}>
        <div className={s.portrait}>
          <span className={s.initial}>{hero.id.charAt(0).toUpperCase()}</span>
        </div>
        <div className={s.heroInfo}>
          <div className={s.archetype}>{hero.archetype} · Complexity {hero.complexity}</div>
          <div className={s.quote}>&ldquo;{hero.signatureQuote}&rdquo;</div>
        </div>
      </section>

      <section className={s.sig}>
        <div className={s.sectionEyebrow}>Signature</div>
        <div className={s.sigName}>{hero.signatureMechanic.name}</div>
        <div className={s.sigDesc}>{hero.signatureMechanic.description}</div>
      </section>

      {[4, 3, 2, 1].map(tier => (byTier[tier as 1|2|3|4] ?? []).length > 0 ? (
        <section key={tier} className={s.abilitySection}>
          <div className={s.tierRow}>
            <TierBadge tier={tier as 1|2|3|4} />
            <div className={s.tierLabel}>
              Tier {tier}{tier === 4 ? ' · Ultimate' : ''}
            </div>
          </div>
          <div className={s.abilities}>
            {byTier[tier as 1|2|3|4]?.map(a => (
              <div key={a.name} className={s.ability}>
                <div className={s.aName}>{a.name}</div>
                <div className={s.aText}>{a.shortText}</div>
                {a.longText ? <div className={s.aLong}>{a.longText}</div> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null)}

      <div className={s.actions}>
        <Button variant="primary" onClick={() => navigate('/heroes')} iconRight="chevron-right">
          Choose for Match
        </Button>
      </div>
    </div>
  )
}

function NotFound({ onBack }: { onBack: () => void }): JSX.Element {
  return (
    <div className={s.notFound}>
      <div>Hero not found.</div>
      <Button variant="default" onClick={onBack}>Back</Button>
    </div>
  )
}

export default HeroDetailScreen
