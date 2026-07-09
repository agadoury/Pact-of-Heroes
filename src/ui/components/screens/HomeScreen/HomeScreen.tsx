/**
 * <HomeScreen>
 *
 * Landing screen — atmospheric backdrop + hero silhouette parade + button
 * stack. Reads persistence for the Resume Match button.
 *
 * Bible reference: Part 8.2.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/ui/components/atoms/Button'
import { AmbientBackdrop } from '@/ui/components/shared/AmbientBackdrop'
import { HeroSilhouette } from '@/ui/components/shared/HeroSilhouette'
import { hasResumableMatch, loadMatchState, clearMatchState } from '@/ui/store/matchPersistence'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import { loadDefaultHero, loadLastRank } from '@/store/deckStorage'
import { isNightmareUnlocked, getStreaks } from '@/store/collectionStorage'
import { getRegisteredHeroIds } from '@/content'
import s from './HomeScreen.module.css'

export function HomeScreen(): JSX.Element {
  const navigate = useNavigate()
  const [canResume, setCanResume] = useState(false)
  // Win Streak Embers — the global streak stares at you between sessions.
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    setCanResume(hasResumableMatch())
    setStreak(getStreaks(loadDefaultHero() ?? 'berserker').global)
  }, [])

  const resume = () => {
    const saved = loadMatchState()
    if (!saved) return
    useUIStore.getState().resetForMatch()
    // Restore the event log too — the post-match summary is computed from
    // it, and a wiped log made resumed matches report only the tail slice.
    useGameStore.setState({
      state: saved.state,
      mode: 'vs-ai',
      aiPlayer: 'p2',
      lastEvents: [],
      matchLog: saved.matchLog,
      aiRank: saved.aiRank,
      sealedBy: saved.sealedBy,
    })
    navigate('/play')
  }

  const discardAndNew = () => {
    clearMatchState()
    navigate('/heroes')
  }

  // Quick Match — one tap into battle: your last-played hero (or the
  // Berserker on a fresh install) against a random other hero, no select
  // screen, no intro cinematic.
  const quickMatch = () => {
    const heroIds = getRegisteredHeroIds()
    const mine = loadDefaultHero() ?? 'berserker'
    const others = heroIds.filter(id => id !== mine)
    const opponent = others[Math.floor(Math.random() * others.length)] ?? heroIds[0]!
    // Reuse the last Pact Rank; a Nightmare pick that isn't unlocked for
    // this hero quietly downgrades to Champion.
    const last = loadLastRank()
    const rank = last === 'squire' || last === 'champion' || last === 'nightmare' ? last : 'champion'
    const aiRank = rank === 'nightmare' && !isNightmareUnlocked(mine) ? 'champion' : rank
    clearMatchState()
    const ui = useUIStore.getState()
    ui.setViewer('p1')
    ui.resetForMatch()
    ui.setSkipIntroOnce(true)
    useGameStore.getState().startMatch({ p1: mine, p2: opponent, mode: 'vs-ai', aiRank })
    navigate('/play')
  }

  return (
    <div className={s.page}>
      <AmbientBackdrop tone="gold" intensity="standard" />
      <div className={s.centerFrame}>
        <div className={s.parade} aria-hidden="true">
          <HeroSilhouette heroId="berserker" size={68} variant="crest" />
          <HeroSilhouette heroId="pyromancer" size={68} variant="crest" />
          <HeroSilhouette heroId="lightbearer" size={68} variant="crest" />
        </div>

        <h1 className={s.title}>Pact of Heroes</h1>
        <div className={s.subtitle}>Three Heroes. One Pact.</div>
        <div className={s.crest} aria-hidden="true">◆</div>

        <div className={s.buttons}>
          {canResume ? (
            <Button variant="primary" onClick={resume} weight={0}>
              Resume Match
            </Button>
          ) : (
            <Button variant="primary" onClick={quickMatch} weight={0}>
              {streak >= 2 ? `⚡ Quick Match · 🔥${streak}` : '⚡ Quick Match'}
            </Button>
          )}
          <Button
            variant="default"
            onClick={canResume ? discardAndNew : () => navigate('/heroes')}
            weight={0}
          >
            {canResume ? 'New Match (discard)' : 'Choose Heroes'}
          </Button>
          <Button variant="default" onClick={() => navigate('/hero-book')} weight={0}>
            Hero Book
          </Button>
          <Button variant="default" onClick={() => navigate('/settings')} weight={0}>
            Settings
          </Button>
          <Button variant="ghost" onClick={() => navigate('/onboarding')} weight={0}>
            How to Play
          </Button>
        </div>
      </div>
      <div className={s.version}>v0.3 · 2026</div>
    </div>
  )
}

export default HomeScreen
