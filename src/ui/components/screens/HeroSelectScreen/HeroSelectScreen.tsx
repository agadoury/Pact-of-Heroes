/**
 * <HeroSelectScreen>
 *
 * Premium pre-match hero select. A large showcase of the selected hero
 * (splash portrait, quote, signature, collection stats, Customize entry)
 * over portrait-card pickers for you and the AI opponent, joined by a VS
 * emblem. Begin Match dispatches start-match.
 *
 * Bible reference: Part 8.3 (reworked - premium select).
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HeroId } from '@/game/types'
import type { AiRank } from '@/game/ai'
import { RANK_RENOWN_MULT } from '@/game/ai'
import { getHero, getRegisteredHeroIds } from '@/content'
import { getCollection, getRankWins, isNightmareUnlocked, NIGHTMARE_UNLOCK_WINS } from '@/store/collectionStorage'
import { loadLastRank } from '@/store/deckStorage'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import { AmbientBackdrop } from '@/ui/components/shared/AmbientBackdrop'
import { HeroPortraitArt } from '@/ui/art/heroArt'
import { HERO_ELEMENT } from '@/ui/types/ui'
import type { BackdropTone } from '@/ui/components/shared/AmbientBackdrop'
import { clsx } from '@/ui/util/clsx'
import s from './HeroSelectScreen.module.css'

export function HeroSelectScreen(): JSX.Element {
  const navigate = useNavigate()
  const startMatch = useGameStore(g => g.startMatch)
  const setViewer  = useUIStore(u => u.setViewer)

  const heroes = getRegisteredHeroIds().map(id => getHero(id))
  const [selectedId, setSelectedId] = useState<HeroId | null>(heroes[0]?.id ?? null)
  const [opponentId, setOpponentId] = useState<HeroId | null>(heroes[1]?.id ?? null)
  const [rank, setRank] = useState<AiRank>(() => {
    const last = loadLastRank()
    return last === 'squire' || last === 'champion' || last === 'nightmare' ? last : 'champion'
  })

  const selected = selectedId ? getHero(selectedId) : null
  const collection = useMemo(
    () => (selectedId ? getCollection(selectedId) : null),
    [selectedId],
  )

  // Nightmare is earned per-hero — 5 Champion wins with the hero you're
  // bringing. A locked pick silently downgrades to Champion at start.
  const nightmareOpen = useMemo(
    () => (selectedId ? isNightmareUnlocked(selectedId) : false),
    [selectedId],
  )
  const championWins = useMemo(
    () => (selectedId ? getRankWins(selectedId).champion ?? 0 : 0),
    [selectedId],
  )
  const effectiveRank: AiRank = rank === 'nightmare' && !nightmareOpen ? 'champion' : rank

  const begin = () => {
    if (!selectedId || !opponentId) return
    setViewer('p1')
    useUIStore.getState().resetForMatch()
    startMatch({ p1: selectedId, p2: opponentId, mode: 'vs-ai', aiRank: effectiveRank })
    navigate('/play')
  }

  const backdropTone: BackdropTone = selected
    ? (HERO_ELEMENT[selected.id] === 'frost' ? 'frost'
      : HERO_ELEMENT[selected.id] === 'ember' ? 'ember' : 'dawn')
    : 'gold'

  return (
    <div className={s.page} style={{ ['--accent' as string]: selected?.accentColor ?? '#d4a548' }}>
      <AmbientBackdrop tone={backdropTone} intensity="low" />
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/')} aria-label="Back">‹</button>
        <div>
          <div className={s.eyebrow}>— Prepare for Battle —</div>
          <div className={s.title}>Choose Your Hero</div>
        </div>
      </header>

      <div className={s.scroll}>
        {/* ── showcase of the selected hero ─────────────────────────── */}
        {selected && collection ? (
          <section key={selected.id} className={s.showcase}>
            <span className={s.showGlow} aria-hidden="true" />
            <div className={s.showPortrait}>
              <HeroPortraitArt heroId={selected.id} size={116} />
            </div>
            <div className={s.showName}>{selected.name}</div>
            <div className={s.showQuote}>&ldquo;{selected.signatureQuote}&rdquo;</div>
            <div className={s.showSig}>
              <strong>{selected.signatureMechanic.name}</strong> — {selected.signatureMechanic.description}
            </div>
            <div className={s.showMeta}>
              <span className={s.pill}>{selected.archetype}</span>
              <span className={s.pill}>
                {'\u2605'.repeat(selected.complexity)}{'\u2606'.repeat(Math.max(0, 3 - selected.complexity))}
              </span>
              <span className={s.pill}>{collection.ownedCount}/{collection.collectibleCount}</span>
              <span className={clsx(s.pill, s.renownPill)}>
                <Icon name="sparkles" size={9} />{collection.renown}
              </span>
              <button
                className={s.customizeLink}
                onClick={() => navigate(`/heroes/${selected.id}/customize`)}
              >
                Customize ›
              </button>
            </div>
          </section>
        ) : null}

        {/* ── your hero picker ──────────────────────────────────────── */}
        <div className={s.sectionEyebrow}>Your Hero</div>
        <div className={s.pickRow}>
          {heroes.map(h => (
            <button
              key={h.id}
              className={clsx(s.pickCard, selectedId === h.id && s.picked)}
              onClick={() => setSelectedId(h.id)}
              style={{ ['--card-accent' as string]: h.accentColor }}
              data-testid={`pick-${h.id}`}
            >
              <span className={s.pickPortrait}><HeroPortraitArt heroId={h.id} size={84} /></span>
              <span className={s.pickName}>{h.name.replace('The ', '')}</span>
            </button>
          ))}
        </div>

        {/* ── VS divider + opponent ─────────────────────────────────── */}
        <div className={s.vsRow}>
          <span className={s.vsRule} />
          <span className={s.vs}>VS</span>
          <span className={s.vsRule} />
        </div>

        <div className={s.sectionEyebrow}>Opponent · AI</div>
        <div className={s.pickRow}>
          {heroes.map(h => (
            <button
              key={h.id}
              className={clsx(s.pickCard, s.oppCard, opponentId === h.id && s.picked)}
              onClick={() => setOpponentId(h.id)}
              style={{ ['--card-accent' as string]: h.accentColor }}
            >
              <span className={s.pickPortrait}><HeroPortraitArt heroId={h.id} size={56} /></span>
              <span className={s.pickName}>{h.name.replace('The ', '')}</span>
            </button>
          ))}
        </div>

        {/* ── Pact Rank — the stakes dial ───────────────────────────── */}
        <div className={s.sectionEyebrow}>Pact Rank · Stakes</div>
        <div className={s.rankRow}>
          {(['squire', 'champion', 'nightmare'] as const).map(r => {
            const locked = r === 'nightmare' && !nightmareOpen
            return (
              <button
                key={r}
                className={clsx(s.rankCard, effectiveRank === r && s.rankPicked, locked && s.rankLocked)}
                onClick={() => { if (!locked) setRank(r) }}
                data-testid={`rank-${r}`}
                aria-disabled={locked}
              >
                <span className={s.rankName}>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                <span className={s.rankMult}>
                  {locked ? '🔒' : `×${RANK_RENOWN_MULT[r]}`}
                </span>
                <span className={s.rankHint}>
                  {r === 'squire' ? 'Takes what it rolls'
                    : r === 'champion' ? 'The standard duel'
                    : locked ? `${championWins}/${NIGHTMARE_UNLOCK_WINS} Champion wins`
                    : 'Blood pact: +3 HP, +1 CP'}
                </span>
              </button>
            )
          })}
        </div>
        <div className={s.scrollPad} />
      </div>

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
