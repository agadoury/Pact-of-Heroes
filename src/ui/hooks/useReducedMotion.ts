/**
 * Subscription to `prefers-reduced-motion: reduce`.
 *
 * Components use this to branch on animation decisions where a CSS-level
 * override (`@media (prefers-reduced-motion: reduce)`) isn't sufficient —
 * typically Framer Motion `animate` props, particle rendering, and any
 * setTimeout-driven choreography.
 *
 * Bible reference: Part 1.6.
 */

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function readInitial(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  const [prefers, setPrefers] = useState<boolean>(readInitial)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches)
    if (mq.addEventListener) {
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    // Safari < 14 fallback
    mq.addListener(handler)
    return () => mq.removeListener(handler)
  }, [])

  return prefers
}
