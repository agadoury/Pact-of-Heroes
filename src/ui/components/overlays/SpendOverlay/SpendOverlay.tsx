/**
 * <SpendOverlay>
 *
 * Bankable-passive spend prompt (Radiance). The engine applies every spend
 * effect for the context per token committed, so the player's real choice
 * is the AMOUNT — this overlay is a token stepper with a live preview of
 * what the committed tokens buy. Confirm / Skip live in the ActionBar.
 *
 * Bible reference: Part 6.2.
 */

import { clsx } from '@/ui/util/clsx'
import s from './SpendOverlay.module.css'

export interface SpendYield {
  id:     string
  /** e.g. "+4 damage" for amount=2 at +2/token */
  value:  string
  /** e.g. "Empower the attack" */
  label:  string
}

export interface SpendOverlayProps {
  active:        boolean
  resourceName:  string
  available:     number
  max:           number
  amount:        number
  yields:        SpendYield[]
  contextLabel:  string
  onAmountChange: (amount: number) => void
  className?:    string
}

export function SpendOverlay({
  active,
  resourceName,
  available,
  max,
  amount,
  yields,
  contextLabel,
  onAmountChange,
  className,
}: SpendOverlayProps): JSX.Element | null {
  if (!active) return null

  const dec = () => onAmountChange(Math.max(0, amount - 1))
  const inc = () => onAmountChange(Math.min(available, amount + 1))

  return (
    <div className={clsx(s.overlay, className)}>
      <div className={s.title}>— Spend {resourceName} —</div>
      <div className={s.context}>{contextLabel}</div>
      <div className={s.available}>
        <span className={s.value}>{available}</span>
        <span className={s.max}>/ {max} banked</span>
      </div>

      <div className={s.stepper}>
        <button
          type="button"
          className={clsx(s.stepBtn, amount <= 0 && s.stepDisabled)}
          onClick={dec}
          disabled={amount <= 0}
          aria-label="Spend one less token"
        >
          −
        </button>
        <div className={s.pips} role="status" aria-label={`Spending ${amount} of ${available} tokens`}>
          {Array.from({ length: Math.max(available, 1) }, (_, i) => (
            <span
              key={i}
              className={clsx(s.pip, i < amount && s.pipLit, i >= available && s.pipVoid)}
              onClick={() => onAmountChange(i < amount ? i : i + 1)}
            />
          ))}
        </div>
        <button
          type="button"
          className={clsx(s.stepBtn, amount >= available && s.stepDisabled)}
          onClick={inc}
          disabled={amount >= available}
          aria-label="Spend one more token"
        >
          +
        </button>
      </div>

      <div className={s.options}>
        {amount === 0 ? (
          <div className={s.zeroHint}>Keep every token banked</div>
        ) : yields.map(y => (
          <div key={y.id} className={clsx(s.option, s.selected)}>
            <span className={s.cost}>{y.value}</span>
            <div className={s.optInfo}>
              <div className={s.optName}>{y.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SpendOverlay
