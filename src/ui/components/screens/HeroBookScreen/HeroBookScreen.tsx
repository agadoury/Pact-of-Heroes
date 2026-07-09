/**
 * <HeroBookScreen>
 *
 * Premium character gallery — one full-width panel per hero with painted
 * portrait, accent glow, archetype/complexity pills, signature line, and
 * live collection progress. Tap a panel for the hero's page.
 *
 * Bible reference: Part 8.5 (reworked — premium gallery).
 */

import { useNavigate } from 'react-router-dom'
import { getHero, getRegisteredHeroIds } from '@/content'
import { getCollection } from '@/store/collectionStorage'
import { AmbientBackdrop } from '@/ui/components/shared/AmbientBackdrop'
import { HeroPortraitArt } from '@/ui/art/heroArt'
import { Icon } from '@/ui/components/atoms/Icon'
import s from './HeroBookScreen.module.css'

export function HeroBookScreen(): JSX.Element {
  const navigate = useNavigate()
  const heroes = getRegisteredHeroIds().map(id => getHero(id))
  return (
    <div className={s.page}>
      <AmbientBackdrop tone="gold" intensity="low" />
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/')} aria-label="Back">‹</button>
        <div>
          <div className={s.eyebrow}>— The Pact —</div>
          <div className={s.title}>Hero Book</div>
        </div>
      </header>

      <div className={s.list}>
        {heroes.map((h, i) => {
          const col = getCollection(h.id)
          const pct = Math.round((col.ownedCount / col.collectibleCount) * 100)
          return (
            <button
              key={h.id}
              className={s.panel}
              style={{ ['--accent' as string]: h.accentColor, animationDelay: `${i * 90}ms` }}
              onClick={() => navigate(`/heroes/${h.id}`)}
              data-testid={`hero-panel-${h.id}`}
            >
              <span className={s.glow} aria-hidden="true" />
              <span className={s.portrait}>
                <HeroPortraitArt heroId={h.id} size={104} />
              </span>
              <span className={s.info}>
                <span className={s.name}>{h.name}</span>
                <span className={s.pills}>
                  <span className={s.pill}>{h.archetype}</span>
                  <span className={s.pill}>
                    {'\u2605'.repeat(h.complexity)}{'\u2606'.repeat(Math.max(0, 3 - h.complexity))}
                  </span>
                </span>
                <span className={s.quote}>&ldquo;{h.signatureQuote}&rdquo;</span>
                <span className={s.progressRow}>
                  <span className={s.progressTrack}>
                    <span className={s.progressFill} style={{ width: `${pct}%` }} />
                  </span>
                  <span className={s.progressLabel}>{col.ownedCount}/{col.collectibleCount}</span>
                  <span className={s.renown}><Icon name="sparkles" size={10} />{col.renown}</span>
                </span>
              </span>
              <span className={s.chevron}>›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default HeroBookScreen
