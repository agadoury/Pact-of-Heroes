/**
 * <Icon>
 *
 * MVP renders Unicode glyphs for each IconName; production replacement to
 * inline SVG paths happens in M6 ticket 6.12. The Unicode fallback works
 * fine for functional testing and dev preview.
 *
 * Bible reference: Part 1.7.
 */

import type { CSSProperties } from 'react'
import type { IconName } from '@/ui/types/icon'
import s from './Icon.module.css'

const GLYPH: Record<IconName, string> = {
  shield:        '◈',
  heart:         '♥',
  lock:          '🔒',
  unlock:        '🔓',
  'chevron-right': '›',
  'chevron-left':  '‹',
  check:         '✓',
  cross:         '✗',
  menu:          '☰',
  settings:      '⚙',
  'scroll-text': '📜',
  sparkles:      '✦',
  flame:         '🔥',
  zap:           '⚡',
  'heart-pulse': '❤',
  droplet:       '💧',
  'trending-up': '↗',
  'arrow-up':    '▲',
  snowflake:     '❄',
  skull:         '☠',
  diamond:       '◆',
  plus:          '+',
  minus:         '−',
  star:          '★',
  flag:          '⚑',
  info:          'ⓘ',
}

export interface IconProps {
  name:       IconName
  size?:      number
  color?:     string
  className?: string
  label?:     string     // accessible label — sets aria-label; else aria-hidden
}

export function Icon({ name, size = 16, color, className, label }: IconProps): JSX.Element {
  const glyph = GLYPH[name] ?? '?'
  const style: CSSProperties = {
    fontSize: size,
    lineHeight: 1,
    color: color ?? 'currentColor',
  }
  return (
    <span
      className={[s.icon, className].filter(Boolean).join(' ')}
      style={style}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
    >
      {glyph}
    </span>
  )
}

export default Icon
