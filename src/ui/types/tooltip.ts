/**
 * Tooltip content types.
 *
 * Bible reference: Part 6.3.
 */

import type { Card } from '@/game/types'
import type { Anchor } from './ui'

export type TooltipContent =
  | { kind: 'signature-token'; name: string; hero: string; count: number; mechanic: string }
  | { kind: 'generic-status';  name: string; mechanic: string; decay: string }
  | { kind: 'card-buff';       name: string; source: string; mechanic: string; remaining: string }
  | { kind: 'resource';        name: string; value: number; max: number; spendOptions: string[] }
  | { kind: 'ability';         name: string; tier: number; combo: string; effect: string; lethal?: string }
  | { kind: 'die';             face: string; meaning: string }
  | { kind: 'card';            card: Card; affordable: boolean; playable: boolean }
  | { kind: 'free-text';       title: string; body: string }

export interface TooltipTarget {
  anchor:  Anchor
  content: TooltipContent
}
