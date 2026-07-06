/**
 * <ScreenShake>
 *
 * Wraps children in a div that translates on the shake axis when the
 * juice store fires a shake. Uses transform (compositor-only, no layout
 * shift).
 */

import { useEffect, useState, type ReactNode } from 'react'
import { useJuiceStore } from '@/ui/hooks/useJuice'
import { useReducedMotion } from '@/ui/hooks/useReducedMotion'
import s from './ScreenShake.module.css'

const SHAKE_DURATION_MS = 350

export interface ScreenShakeProps {
  children: ReactNode
}

export function ScreenShake({ children }: ScreenShakeProps): JSX.Element {
  const magnitude = useJuiceStore(st => st.shakeMagnitude)
  const startedAt = useJuiceStore(st => st.shakeStartedAt)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!magnitude || reduced) { setOffset({ x: 0, y: 0 }); return }
    let raf = 0
    const tick = () => {
      const elapsed = performance.now() - startedAt
      const t = elapsed / SHAKE_DURATION_MS
      if (t >= 1) { setOffset({ x: 0, y: 0 }); return }
      const decay = 1 - t
      const jitter = magnitude * decay * decay
      setOffset({
        x: (Math.random() * 2 - 1) * jitter,
        y: (Math.random() * 2 - 1) * jitter,
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [magnitude, startedAt, reduced])

  return (
    <div
      className={s.wrap}
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
    >
      {children}
    </div>
  )
}

export default ScreenShake
