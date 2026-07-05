/**
 * <HeroSelectScreen>
 *
 * Three hero cards + detail panel + Begin Match. Dispatches start-match
 * to the game store on confirm.
 *
 * Bible reference: Part 8.3.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HeroId } from '@/game/types'
import { getHero, getRegisteredHeroIds } from '@/content'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { Button } from '@/ui/components/atoms/Button'
import { clsx } from '@/ui/util/clsx'
import s from './HeroSelectScreen.module.css'

export function HeroSelectScreen(): JSX.Element {
  const navigate = useNavigate()
  const startMatch = useGameStore(g => g.startMatch)
  const setViewer  = useUIStore(u => u.setViewer)

  const heroes = getRegisteredHeroIds().map(id => getHero(id))
  const [selectedId, setSelectedId] = useState<HeroId | null>(heroes[0]?.id ?? null)
  const [opponentId, setOpponentId] = useState<HeroId | null>(heroes[1]?.id ?? null)

  const selected = selectedId ? getHero(selectedId) : null

  const begin = () => {
    if (!selectedId || !opponentId) return
    setViewer('p1')
    startMatch({ p1: selectedId, p2: opponentId, mode: 'vs-ai' })
    navigate('/play')
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/')}>‹ Back</button>
        <div className={s.title}>Choose Your Hero</div>
      </header>

      <section className={s.section}>
        <h2>You</h2>
        <div className={s.heroRow}>
          {heroes.map(h => (
            <div
              key={h.id}
              className={clsx(s.heroCard, selectedId === h.id && s.selected)}
              onClick={() => setSelectedId(h.id)}
              style={{ ['--accent' as string]: h.accentColor }}
            >
              <div className={s.heroName}>{h.name}</div>
              <div className={s.heroArchetype}>{h.archetype}</div>
              <div className={s.heroComplexity}>
                {'★'.repeat(h.complexity)}
                {'☆'.repeat(Math.max(0, 3 - h.complexity))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <h2>Opponent (AI)</h2>
        <div className={s.heroRow}>
          {heroes.map(h => (
            <div
              key={h.id}
              className={clsx(s.heroCard, s.opponentCard, opponentId === h.id && s.selected)}
              onClick={() => setOpponentId(h.id)}
              style={{ ['--accent' as string]: h.accentColor }}
            >
              <div className={s.heroName}>{h.name}</div>
              <div className={s.heroArchetype}>{h.archetype}</div>
            </div>
          ))}
        </div>
      </section>

      {selected ? (
        <section className={s.detail}>
          <div className={s.detailQuote}>&ldquo;{selected.signatureQuote}&rdquo;</div>
          <div className={s.detailSig}>
            <strong>Signature:</strong> {selected.signatureMechanic.name}
            <div className={s.detailSigDesc}>
              {selected.signatureMechanic.description}
            </div>
          </div>
        </section>
      ) : null}

      <div className={s.actions}>
        <Button
          variant={selectedId && opponentId ? 'primary' : 'disabled'}
          onClick={begin}
          iconRight="chevron-right"
        >
          Begin Match
        </Button>
      </div>
    </div>
  )
}

export default HeroSelectScreen
