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
import s from './HomeScreen.module.css'

export function HomeScreen(): JSX.Element {
  const navigate = useNavigate()
  const [canResume, setCanResume] = useState(false)

  useEffect(() => { setCanResume(hasResumableMatch()) }, [])

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
    })
    navigate('/play')
  }

  const discardAndNew = () => {
    clearMatchState()
    navigate('/heroes')
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
          ) : null}
          <Button
            variant={canResume ? 'default' : 'primary'}
            onClick={canResume ? discardAndNew : () => navigate('/heroes')}
            weight={0}
          >
            {canResume ? 'New Match (discard)' : 'New Match'}
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
