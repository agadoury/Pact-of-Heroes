/**
 * <HomeScreen>
 *
 * Landing screen. Title + button stack.
 *
 * Bible reference: Part 8.2.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/ui/components/atoms/Button'
import { hasResumableMatch, loadMatchState, clearMatchState } from '@/ui/store/matchPersistence'
import { useGameStore } from '@/store/gameStore'
import s from './HomeScreen.module.css'

export function HomeScreen(): JSX.Element {
  const navigate = useNavigate()
  const [canResume, setCanResume] = useState(false)

  useEffect(() => { setCanResume(hasResumableMatch()) }, [])

  const resume = () => {
    const state = loadMatchState()
    if (!state) return
    // Directly seed the game store with the restored state.
    useGameStore.setState({ state, mode: 'vs-ai', aiPlayer: 'p2', lastEvents: [], matchLog: [] })
    navigate('/play')
  }

  const discardAndNew = () => {
    clearMatchState()
    navigate('/heroes')
  }

  return (
    <div className={s.page}>
      <div className={s.center}>
        <h1 className={s.title}>Pact of Heroes</h1>
        <div className={s.subtitle}>Three Heroes, One Pact</div>
        <div className={s.crest}>◆</div>
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
            Heroes
          </Button>
          <Button variant="default" onClick={() => navigate('/settings')} weight={0}>
            Settings
          </Button>
          <Button variant="ghost" onClick={() => navigate('/ui-preview')} weight={0}>
            UI Preview
          </Button>
        </div>
      </div>
      <div className={s.version}>v0.2 · 2026</div>
    </div>
  )
}

export default HomeScreen
