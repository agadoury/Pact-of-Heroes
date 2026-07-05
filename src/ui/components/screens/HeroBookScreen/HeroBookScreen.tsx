/**
 * <HeroBookScreen>
 *
 * Browsable list of registered heroes.
 *
 * Bible reference: Part 8.5.
 */

import { useNavigate } from 'react-router-dom'
import { getHero, getRegisteredHeroIds } from '@/content'
import { clsx } from '@/ui/util/clsx'
import s from './HeroBookScreen.module.css'

export function HeroBookScreen(): JSX.Element {
  const navigate = useNavigate()
  const heroes = getRegisteredHeroIds().map(id => getHero(id))
  return (
    <div className={s.page}>
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/')}>‹ Back</button>
        <div className={s.title}>Hero Book</div>
      </header>
      <div className={s.list}>
        {heroes.map(h => (
          <div
            key={h.id}
            className={clsx(s.card)}
            style={{ ['--accent' as string]: h.accentColor }}
            onClick={() => navigate(`/heroes/${h.id}`)}
          >
            <div className={s.portrait}>
              <span className={s.initial}>{h.id.charAt(0).toUpperCase()}</span>
            </div>
            <div className={s.info}>
              <div className={s.name}>{h.name}</div>
              <div className={s.archetype}>{h.archetype}</div>
              <div className={s.quote}>&ldquo;{h.signatureQuote}&rdquo;</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HeroBookScreen
