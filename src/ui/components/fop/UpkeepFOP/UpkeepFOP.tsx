/**
 * <UpkeepFOP>
 *
 * Lightweight middle-band overlay for upkeep beats (status ticks, draw,
 * cp gain, deck shuffle). ~700ms beat driven by internal timers.
 *
 * Bible reference: Part 5.3.5.
 */

import { useEffect, useMemo } from 'react'
import { clsx } from '@/ui/util/clsx'
import { DURATION } from '@/ui/util/duration'
import type { SubEventData } from '@/ui/types/fop'
import s from './UpkeepFOP.module.css'

export interface UpkeepFOPProps {
  data:        SubEventData
  onComplete?: () => void
  className?:  string
}

export function UpkeepFOP({ data, onComplete, className }: UpkeepFOPProps): JSX.Element {
  useEffect(() => {
    if (!onComplete) return
    const t = window.setTimeout(onComplete, DURATION.upkeepBeat)
    return () => window.clearTimeout(t)
  }, [onComplete, data])

  const valueText = useMemo(() => {
    if (data.value == null) return ''
    return String(data.value)
  }, [data.value])

  return (
    <div className={clsx(s.overlay, s[`tone-${data.tone}`], className)}>
      <div className={s.label}>{data.label}</div>
      <div className={s.value}>{valueText}</div>
      {data.subtext ? <div className={s.subtext}>{data.subtext}</div> : null}
    </div>
  )
}

export default UpkeepFOP
