/**
 * <ScreenBands>
 *
 * The 7-band flex column that composes the match screen. Children stack
 * top-to-bottom in this order:
 *
 *   OpponentStrip   13%
 *   PhaseBanner     3.5%
 *   DiceTray        13%
 *   MiddleBand      28%
 *   SelfStrip       12%
 *   Hand            20%
 *   ActionBar       7.5%
 *
 * The container is position:relative so overlays (defensive picker, spend,
 * card-play, ability modal, ultimate takeover) can anchor absolutely
 * against it via `inset` percentages.
 *
 * Bible reference: Part 2.1.
 */

import type { ReactNode } from 'react'
import { clsx } from '@/ui/util/clsx'
import s from './ScreenBands.module.css'

export interface ScreenBandsProps {
  children:   ReactNode
  className?: string
}

export function ScreenBands({ children, className }: ScreenBandsProps): JSX.Element {
  return <div className={clsx(s.container, className)}>{children}</div>
}

export default ScreenBands
