/**
 * <ActionBar>
 *
 * Renders a list of ActionButton props as buttons. Skip Turn always in
 * leftmost slot per Part 2.8.
 *
 * Bible reference: Part 2.8.
 */

import { clsx } from '@/ui/util/clsx'
import { Button } from '@/ui/components/atoms/Button'
import type { ActionButton } from '@/ui/types/action-bar'
import s from './ActionBar.module.css'

export interface ActionBarProps {
  buttons:    ActionButton[]
  className?: string
}

export function ActionBar({ buttons, className }: ActionBarProps): JSX.Element {
  return (
    <div className={clsx(s.bar, className)}>
      {buttons.map((btn) => (
        <Button
          key={btn.id}
          variant={btn.variant}
          badge={btn.badge}
          iconLeft={btn.iconLeft}
          iconRight={btn.iconRight}
          onClick={btn.onTap}
        >
          {btn.label}
        </Button>
      ))}
    </div>
  )
}

export default ActionBar
