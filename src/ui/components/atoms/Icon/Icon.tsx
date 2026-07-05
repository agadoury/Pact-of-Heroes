/**
 * <Icon>
 *
 * Inline SVG icon component with a fixed name registry. Paths are drawn
 * from the Lucide icon set (MIT-licensed) simplified to the essential
 * strokes. Every icon renders at 24×24 viewBox regardless of `size`.
 *
 * Bible reference: Part 1.7.
 */

import type { CSSProperties } from 'react'
import type { IconName } from '@/ui/types/icon'
import { clsx } from '@/ui/util/clsx'
import s from './Icon.module.css'

interface IconDef {
  /** SVG children string (paths/lines/polylines). */
  d:      string
  /** Whether stroke or fill drives the shape. */
  mode:   'stroke' | 'fill'
}

const ICONS: Record<IconName, IconDef> = {
  shield: {
    mode: 'stroke',
    d:    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  },
  heart: {
    mode: 'stroke',
    d:    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  },
  lock: {
    mode: 'stroke',
    d:    '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  },
  unlock: {
    mode: 'stroke',
    d:    '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  },
  'chevron-right': {
    mode: 'stroke',
    d:    '<path d="m9 18 6-6-6-6"/>',
  },
  'chevron-left': {
    mode: 'stroke',
    d:    '<path d="m15 18-6-6 6-6"/>',
  },
  check: {
    mode: 'stroke',
    d:    '<path d="M20 6 9 17l-5-5"/>',
  },
  cross: {
    mode: 'stroke',
    d:    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  },
  menu: {
    mode: 'stroke',
    d:    '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  },
  settings: {
    mode: 'stroke',
    d:    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  },
  'scroll-text': {
    mode: 'stroke',
    d:    '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
  },
  sparkles: {
    mode: 'stroke',
    d:    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  },
  flame: {
    mode: 'stroke',
    d:    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  },
  zap: {
    mode: 'stroke',
    d:    '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  },
  'heart-pulse': {
    mode: 'stroke',
    d:    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  },
  droplet: {
    mode: 'stroke',
    d:    '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  },
  'trending-up': {
    mode: 'stroke',
    d:    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  },
  'arrow-up': {
    mode: 'stroke',
    d:    '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  },
  snowflake: {
    mode: 'stroke',
    d:    '<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
  },
  skull: {
    mode: 'stroke',
    d:    '<path d="M8 22h8"/><path d="M12 17v5"/><path d="M5 17a4 4 0 0 1-3.464-6 6 6 0 0 1 5.464-9 7 7 0 0 1 14 0 6 6 0 0 1 5.464 9A4 4 0 0 1 19 17H5Z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>',
  },
  diamond: {
    mode: 'stroke',
    d:    '<path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.71 2.71a2.41 2.41 0 0 0-3.41 0z"/>',
  },
  plus: {
    mode: 'stroke',
    d:    '<path d="M12 5v14"/><path d="M5 12h14"/>',
  },
  minus: {
    mode: 'stroke',
    d:    '<path d="M5 12h14"/>',
  },
  star: {
    mode: 'stroke',
    d:    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  },
  flag: {
    mode: 'stroke',
    d:    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  },
  info: {
    mode: 'stroke',
    d:    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  },
}

export interface IconProps {
  name:       IconName
  size?:      number
  color?:     string
  className?: string
  label?:     string
}

export function Icon({ name, size = 16, color, className, label }: IconProps): JSX.Element {
  const def = ICONS[name] ?? ICONS.star
  const style: CSSProperties = { color: color ?? 'currentColor' }
  const commonProps = {
    width:  size,
    height: size,
    viewBox: '0 0 24 24',
    className: clsx(s.icon, className),
    style,
    'aria-label': label,
    'aria-hidden': label ? undefined : true,
    role: label ? 'img' as const : undefined,
  }
  const svgProps = def.mode === 'stroke'
    ? { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    : { fill: 'currentColor', stroke: 'none' }
  return (
    <svg {...commonProps} {...svgProps} dangerouslySetInnerHTML={{ __html: def.d }} />
  )
}

export default Icon
