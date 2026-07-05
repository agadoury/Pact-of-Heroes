/**
 * <Button>
 *
 * The action-bar variant primitive. Six variants:
 *   default  — soft gold gradient, gold-dim border
 *   primary  — bright gold gradient, night-deep text — the main commit action
 *   crimson  — crimson gradient — lethal / destructive commit
 *   disabled — opacity 0.55, pointer-events none
 *   skip     — small subordinate skip-turn variant
 *   ghost    — transparent with subtle hover, used inside overlays
 *
 * Buttons flex to fill by default (weight prop overrides flex weight).
 *
 * Bible reference: Part 2.8.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from '@/ui/util/clsx'
import { Icon } from '../Icon'
import type { IconName } from '@/ui/types/icon'
import s from './Button.module.css'

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'crimson'
  | 'disabled'
  | 'skip'
  | 'ghost'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?:   ButtonVariant
  badge?:     string | number
  iconLeft?:  IconName
  iconRight?: IconName
  weight?:    number             // flex weight override; defaults to variant default
  children:   ReactNode
}

const WEIGHT_BY_VARIANT: Record<ButtonVariant, number> = {
  default:  1,
  primary:  1.5,
  crimson:  1.5,
  disabled: 1,
  skip:     0,
  ghost:    0,
}

export function Button({
  variant   = 'default',
  badge,
  iconLeft,
  iconRight,
  weight,
  className,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  const isDisabled = variant === 'disabled'
  const flexWeight = weight ?? WEIGHT_BY_VARIANT[variant]

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={clsx(s.button, s[variant], className)}
      style={flexWeight === 0 ? undefined : { flex: flexWeight }}
      {...rest}
    >
      {iconLeft ? <Icon name={iconLeft} size={12} className={s.iconLeft} /> : null}
      <span className={s.label}>{children}</span>
      {badge != null ? <span className={s.badge}>{badge}</span> : null}
      {iconRight ? <Icon name={iconRight} size={14} className={s.iconRight} /> : null}
    </button>
  )
}

export default Button
