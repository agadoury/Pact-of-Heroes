/**
 * Pact of Heroes — cubic-bezier easing constants.
 *
 * Every transition in the UI references one of these easings. Never
 * inline a cubic-bezier expression in a component.
 *
 * Bible reference: Part 1.4.
 */

export const EASING = {
  /** Smooth in-out (Material's standard curve). */
  default:    'cubic-bezier(0.4, 0, 0.2, 1)',

  /** Ease-out — for entry animations. */
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',

  /** Ease-in — for exit animations. */
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',

  /** Spring-like overshoot — damage number entry, badge scale-in. */
  overshoot:  'cubic-bezier(0.34, 1.56, 0.64, 1)',

  /** Sharp end — cinematic moments. */
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
} as const

export type EasingKey = keyof typeof EASING
