/**
 * Long-press hook — fires `callback(event)` after the pointer has been held
 * stationary on the target for `delayMs`.
 *
 * Movement > `moveTolerancePx` cancels the timer, so scrolling gestures
 * never trigger a tooltip. Pointer up before the delay also cancels.
 *
 * Returns a set of props to spread onto the target element.
 *
 * Bible reference: Part 6.3.
 */

import { useCallback, useRef } from 'react'
import { DURATION } from '@/ui/util/duration'

export interface UseLongPressOptions {
  delayMs?:          number
  moveTolerancePx?:  number
}

export type LongPressHandlers = {
  onPointerDown:   (e: React.PointerEvent) => void
  onPointerMove:   (e: React.PointerEvent) => void
  onPointerUp:     (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
  onPointerLeave:  (e: React.PointerEvent) => void
}

export function useLongPress(
  callback: (e: React.PointerEvent) => void,
  { delayMs = DURATION.longPress, moveTolerancePx = 8 }: UseLongPressOptions = {},
): LongPressHandlers {
  const timerRef  = useRef<number | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const firedRef  = useRef<boolean>(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    firedRef.current = false
    originRef.current = { x: e.clientX, y: e.clientY }
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true
      callback(e)
    }, delayMs)
  }, [callback, delayMs, clearTimer])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!originRef.current) return
    const dx = e.clientX - originRef.current.x
    const dy = e.clientY - originRef.current.y
    if (Math.hypot(dx, dy) > moveTolerancePx) {
      clearTimer()
    }
  }, [moveTolerancePx, clearTimer])

  const cancel = useCallback((_e: React.PointerEvent) => {
    clearTimer()
    originRef.current = null
  }, [clearTimer])

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp:     cancel,
    onPointerCancel: cancel,
    onPointerLeave:  cancel,
  }
}
