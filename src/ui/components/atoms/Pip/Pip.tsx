/**
 * <Pip>
 *
 * Small square/round marker used by ComboGlyphStrip and any other place
 * that needs a filled/outlined pip. Three states mirroring PipState:
 * pulse (animated), gold, outlined.
 *
 * Bible reference: Part 3.4.
 */

import type { ReactNode } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { PipState } from '@/ui/types/ability'
import s from './Pip.module.css'

export type PipSize = 'default' | 'prominent' | 'reference'

export interface PipProps {
  state:    PipState
  size?:    PipSize
  variant?: 'offensive' | 'defensive'
  children?: ReactNode         // the sigil glyph or number rendered inside
}

export function Pip({
  state,
  size = 'default',
  variant = 'offensive',
  children,
}: PipProps): JSX.Element {
  return (
    <div className={clsx(s.pip, s[state], s[size], s[variant])}>
      {children != null ? <span className={s.face}>{children}</span> : null}
    </div>
  )
}

export default Pip
