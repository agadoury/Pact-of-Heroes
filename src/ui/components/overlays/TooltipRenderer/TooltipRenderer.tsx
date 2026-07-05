/**
 * <TooltipRenderer>
 *
 * Renders the current uiStore.tooltipTarget with viewport clamping.
 * Auto-dismisses after 5s.
 *
 * Bible reference: Part 6.3.
 */

import { useEffect } from 'react'
import { clsx } from '@/ui/util/clsx'
import { useUIStore } from '@/ui/store/uiStore'
import { DURATION } from '@/ui/util/duration'
import type { TooltipContent } from '@/ui/types/tooltip'
import s from './TooltipRenderer.module.css'

export function TooltipRenderer(): JSX.Element | null {
  const target = useUIStore(state => state.tooltipTarget)
  const clear  = useUIStore(state => state.setTooltip)

  useEffect(() => {
    if (!target) return
    const t = window.setTimeout(() => clear(null), DURATION.toastTooltip)
    return () => window.clearTimeout(t)
  }, [target, clear])

  if (!target) return null

  const { anchor, content } = target
  const { title, body } = renderContent(content)

  const style: React.CSSProperties = {
    left: Math.max(8, Math.min(anchor.x, window.innerWidth - 288)),
    top:  Math.max(48, anchor.y - 8),
    transform: 'translate(-50%, -100%)',
  }

  return (
    <div
      className={clsx(s.tooltip)}
      style={style}
      role="tooltip"
      onClick={() => clear(null)}
    >
      <div className={s.title}>{title}</div>
      <div className={s.body}>{body}</div>
    </div>
  )
}

function renderContent(c: TooltipContent): { title: string; body: string } {
  switch (c.kind) {
    case 'signature-token':
      return { title: c.name, body: `${c.hero} signature. ${c.count} stacks. ${c.mechanic}` }
    case 'generic-status':
      return { title: c.name, body: `${c.mechanic} ${c.decay}` }
    case 'card-buff':
      return { title: c.name, body: `${c.mechanic} · Source: ${c.source} · Remaining: ${c.remaining}` }
    case 'resource':
      return { title: c.name, body: `${c.value}/${c.max}. Spend options: ${c.spendOptions.join(', ')}` }
    case 'ability':
      return { title: `${c.name} · T${c.tier}`, body: `Combo: ${c.combo}. Effect: ${c.effect}${c.lethal ? ` · ⚠ ${c.lethal}` : ''}` }
    case 'die':
      return { title: c.face, body: `${c.meaning}` }
    case 'card':
      return { title: c.card.name, body: `${c.card.cost} CP · ${c.card.text.slice(0, 80)}` }
    case 'free-text':
      return { title: c.title, body: c.body }
  }
}

export default TooltipRenderer
