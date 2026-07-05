/**
 * <HomeScreen>
 *
 * Landing screen. Title + button stack.
 *
 * Bible reference: Part 8.2.
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/ui/components/atoms/Button'
import s from './HomeScreen.module.css'

export function HomeScreen(): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className={s.page}>
      <div className={s.center}>
        <h1 className={s.title}>Pact of Heroes</h1>
        <div className={s.subtitle}>Three Heroes, One Pact</div>
        <div className={s.crest}>◆</div>
        <div className={s.buttons}>
          <Button variant="primary" onClick={() => navigate('/heroes')} weight={0}>
            New Match
          </Button>
          <Button variant="default" onClick={() => navigate('/heroes')} weight={0}>
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
