/**
 * ActionBar button props + configuration.
 *
 * The bar is context-driven — its buttons change per phase (planning,
 * defense, spend, opponent turn, atone, modal open). See
 * `selectors/actionBar.ts` for the mapping.
 *
 * Bible reference: Part 2.8.
 */

import type { IconName } from './icon'

export type ActionButtonVariant =
  | 'default'
  | 'primary'
  | 'crimson'
  | 'disabled'
  | 'skip'

export interface ActionButton {
  id:         string
  label:      string
  variant:    ActionButtonVariant
  badge?:     string | number
  iconLeft?:  IconName
  iconRight?: IconName
  onTap?:     () => void
}
