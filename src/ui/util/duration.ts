/**
 * Pact of Heroes — animation duration constants.
 *
 * Every timing in the UI references a value from this table. No magic numbers
 * in components.
 *
 * Bible reference: Part 1.4.
 */

export const DURATION = {
  // Micro-interactions
  tap:              80,      // Confirm button flash on tap
  hover:            150,     // Hover state transition (desktop only)
  ripple:           250,     // Tap ripple effect

  // Resolution pipeline phases — sum to ~2000ms total arc
  resolutionConfirm:  100,   // 0 → 100ms:   confirm button flash
  resolutionFadeIn:   250,   // 100 → 350ms: ladder fades out, FOP fades in
  resolutionNameIn:   200,   // 250 → 450ms: ability name renders
  resolutionDamage:   200,   // 450 → 650ms: damage number scales in with overshoot
  resolutionEffects:  200,   // 700 → 900ms: multi-effect rows stagger in (100ms each)
  resolutionHold:     400,   // 1000 → 1400ms: cinematic holds
  resolutionFadeOut:  300,   // 1400 → 1700ms: FOP fades, ladder fades back
  resolutionSettle:   300,   // 1700 → 2000ms: final settle

  // Token animations
  tokenSlamIn:      250,     // Token appears on a strip
  tokenIncrement:   300,     // Stack count goes up
  tokenDecrement:   200,     // Stack count goes down
  tokenConsume:     400,     // Token consumed by ability
  tokenDetonate:    600,     // Cinder detonates

  // Ultimate
  ultimateTakeoverIn:  400,
  ultimateHold:        2700,
  ultimateTakeoverOut: 400,

  // Dice
  diceTumble:   600,   // Rolling animation
  diceSettle:   150,   // Dice settle after roll

  // HP bar
  hpDrop:       600,   // Smooth HP decrease

  // Modal overlays
  overlayIn:    300,
  overlayOut:   200,

  // Continuous pulse cycles
  cinderPulse:    600,
  lethalPulse:    1200,
  radiancePulse:  1400,
  dawnPipPulse:   1800,

  // Upkeep FOP beat
  upkeepBeat:   700,   // full lightweight variant beat
  upkeepGap:    100,   // between consecutive upkeep beats

  // Match intro
  matchIntro:   1800,

  // Match summary
  summaryEntry: 2500,

  // Long-press threshold
  longPress:    400,

  // Toast defaults
  toastDefault: 3000,
  toastTooltip: 5000,
} as const

export type DurationKey = keyof typeof DURATION
