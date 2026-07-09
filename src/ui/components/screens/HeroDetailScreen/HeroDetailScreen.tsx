/**
 * <HeroDetailScreen>
 *
 * Premium hero page — splash portrait with accent glow, collection stats,
 * dice identity strip, signature callout, the EQUIPPED loadout (editable
 * straight from here), and the full catalog by tier with owned/locked
 * states. Sticky action bar: Customize + one-tap Choose for Match.
 *
 * Bible reference: Part 8.6 (reworked — premium hero page).
 */

import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getHero, getRegisteredHeroIds } from '@/content'
import type { HeroId, AbilityDef } from '@/game/types'
import { loadLoadout } from '@/store/loadoutStorage'
import { getCollection, abilityPrice } from '@/store/collectionStorage'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import { Sigil } from '@/ui/components/atoms/Sigil'
import { AmbientBackdrop } from '@/ui/components/shared/AmbientBackdrop'
import { HeroPortraitArt } from '@/ui/art/heroArt'
import { HERO_ELEMENT } from '@/ui/types/ui'
import type { BackdropTone } from '@/ui/components/shared/AmbientBackdrop'
import { clsx } from '@/ui/util/clsx'
import s from './HeroDetailScreen.module.css'

export function HeroDetailScreen(): JSX.Element {
  const navigate = useNavigate()
  const { heroId } = useParams<{ heroId: HeroId }>()
  if (!heroId) return <NotFound onBack={() => navigate('/hero-book')} />
  let hero
  try { hero = getHero(heroId) } catch { return <NotFound onBack={() => navigate('/hero-book')} /> }

  const collection = useMemo(() => getCollection(heroId), [heroId])
  const loadout = useMemo(() => loadLoadout(heroId) ?? hero.recommendedLoadout, [heroId, hero])

  const byTier: Partial<Record<1 | 2 | 3 | 4, AbilityDef[]>> = {}
  for (const abil of hero.abilityCatalog) {
    (byTier[abil.tier as 1 | 2 | 3 | 4] ||= []).push(abil)
  }

  const backdropTone: BackdropTone = (() => {
    const el = HERO_ELEMENT[hero.id]
    if (el === 'frost') return 'frost'
    if (el === 'ember') return 'ember'
    return 'dawn'
  })()

  // One-tap match: this hero vs a random other hero.
  const chooseForMatch = () => {
    const others = getRegisteredHeroIds().filter(id => id !== heroId)
    const opponent = others[Math.floor(Math.random() * others.length)] ?? heroId
    useUIStore.getState().setViewer('p1')
    useUIStore.getState().resetForMatch()
    useGameStore.getState().startMatch({ p1: heroId, p2: opponent, mode: 'vs-ai' })
    navigate('/play')
  }

  const pct = Math.round((collection.ownedCount / collection.collectibleCount) * 100)

  return (
    <div className={s.page} style={{ ['--accent' as string]: hero.accentColor }}>
      <AmbientBackdrop tone={backdropTone} intensity="low" />
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/hero-book')} aria-label="Back">‹</button>
        <div className={s.headerTitle}>{hero.name}</div>
        <span className={s.renown}><Icon name="sparkles" size={11} />{collection.renown}</span>
      </header>

      <div className={s.scroll}>
        {/* ── splash ─────────────────────────────────────────────────── */}
        <section className={s.splash}>
          <span className={s.splashGlow} aria-hidden="true" />
          <div className={s.portrait}>
            <HeroPortraitArt heroId={hero.id} size={132} />
          </div>
          <div className={s.name}>{hero.name}</div>
          <div className={s.quote}>&ldquo;{hero.signatureQuote}&rdquo;</div>
          <div className={s.pills}>
            <span className={s.pill}>{hero.archetype}</span>
            <span className={s.pill}>
              {'\u2605'.repeat(hero.complexity)}{'\u2606'.repeat(Math.max(0, 3 - hero.complexity))}
            </span>
            <span className={s.pill}>{collection.ownedCount}/{collection.collectibleCount} collected</span>
          </div>
          <div className={s.progressTrack}>
            <span className={s.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </section>

        {/* ── dice identity ──────────────────────────────────────────── */}
        <section>
          <div className={s.sectionEyebrow}>Dice Identity</div>
          <div className={s.diceRow}>
            {hero.diceIdentity.faces.map(f => (
              <div key={f.faceValue} className={s.face}>
                <span className={s.faceValue}>{f.faceValue}</span>
                <Sigil symbol={f.symbol} size={18} />
                <span className={s.faceLabel}>{f.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── signature ──────────────────────────────────────────────── */}
        <section className={s.sig}>
          <div className={s.sectionEyebrow}>Signature — {hero.signatureMechanic.name}</div>
          <div className={s.sigDesc}>{hero.signatureMechanic.description}</div>
        </section>

        {/* ── equipped loadout ───────────────────────────────────────── */}
        <section>
          <div className={s.loadoutHead}>
            <div className={s.sectionEyebrow}>Equipped Loadout</div>
            <button className={s.editLink} onClick={() => navigate(`/heroes/${heroId}/customize`)}>
              Customize ›
            </button>
          </div>
          <div className={s.loadoutGrid}>
            {loadout.offense.map((name, i) => (
              <button
                key={`o-${i}`}
                className={s.loadoutSlot}
                onClick={() => navigate(`/heroes/${heroId}/customize`)}
              >
                <span className={clsx(s.slotTier, s[`t${i + 1}`])}>T{i + 1}</span>
                <span className={s.slotName}>{name}</span>
              </button>
            ))}
            {loadout.defense.map((name, i) => (
              <button
                key={`d-${i}`}
                className={s.loadoutSlot}
                onClick={() => navigate(`/heroes/${heroId}/customize`)}
              >
                <span className={clsx(s.slotTier, s.def)}>DEF</span>
                <span className={s.slotName}>{name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── catalog by tier ────────────────────────────────────────── */}
        {([4, 3, 2, 1] as const).map(tier => (byTier[tier] ?? []).length > 0 ? (
          <section key={tier}>
            <div className={s.sectionEyebrow}>
              Tier {tier}{tier === 4 ? ' · Ultimate' : ''}
            </div>
            <div className={s.abilities}>
              {byTier[tier]?.map(a => {
                const owned = collection.ownedAbilities.has(a.name)
                const equipped = loadout.offense.includes(a.name) || loadout.defense.includes(a.name)
                return (
                  <div key={a.name} className={clsx(s.ability, s[`tier${tier}`], !owned && s.locked)}>
                    <div className={s.aTop}>
                      <span className={s.aName}>{a.name}</span>
                      {equipped ? <span className={s.aEquipped}><Icon name="check" size={9} /> Equipped</span>
                        : !owned ? <span className={s.aLocked}><Icon name="lock" size={9} /> {abilityPrice(a)} <Icon name="sparkles" size={9} /></span>
                        : null}
                    </div>
                    <div className={s.aText}>{a.longText || a.shortText}</div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null)}
        <div className={s.scrollPad} />
      </div>

      {/* ── sticky actions ───────────────────────────────────────────── */}
      <div className={s.actions}>
        <Button variant="default" onClick={() => navigate(`/heroes/${heroId}/customize`)}>
          Customize
        </Button>
        <Button variant="primary" onClick={chooseForMatch} iconRight="chevron-right">
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
