/**
 * <TurnBanner>
 *
 * Big dramatic banner that flashes across the middle of the screen when
 * a new turn starts. Fires on turn-started matchLog events; distinguishes
 * viewer's turn (gold) vs opponent's (ember).
 */

import { useEffect, useRef, useState } from 'react'
import { clsx } from '@/ui/util/clsx'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/ui/store/uiStore'
import type { PlayerId } from '@/game/types'
import s from './TurnBanner.module.css'

interface BannerState {
  key: number
  text: string
  variant: 'you' | 'opponent'
}

export function TurnBanner(): JSX.Element | null {
  const lastIdx = useRef(0)
  const [banner, setBanner] = useState<BannerState | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length < lastIdx.current) lastIdx.current = 0
      if (log.length <= lastIdx.current) return
      const viewer = useUIStore.getState().viewerId
      for (let i = lastIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (ev?.t === 'turn-started') {
          const player: PlayerId = ev.player
          const isViewer = player === viewer
          setBanner({
            key: Date.now(),
            text: isViewer ? 'Your Turn' : 'Opponent’s Turn',
            variant: isViewer ? 'you' : 'opponent',
          })
          if (timer.current != null) window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setBanner(null), 1400)
        }
      }
      lastIdx.current = log.length
    })
    return () => {
      unsub()
      if (timer.current != null) window.clearTimeout(timer.current)
    }
  }, [])

  if (!banner) return null
  return (
    <div key={banner.key} className={clsx(s.overlay, s[banner.variant])} aria-hidden="true">
      <div className={s.card}>
        <div className={s.eyebrow}>— Turn Begins —</div>
        <div className={s.text}>{banner.text}</div>
      </div>
    </div>
  )
}

export default TurnBanner
