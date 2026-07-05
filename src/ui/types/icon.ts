/**
 * UI icon name registry.
 *
 * Bible reference: Part 1.7.
 *
 * The die-face glyph icons (`sword`, `defense`, `momentum`, `signature`,
 * `ultimate`, `blank`) from the bible are dropped because they don't exist
 * across the engine's real hero symbol sets. Each hero defines its own
 * symbols (Berserker: axe/fur/howl; Pyromancer: ash/ember/magma/ruin;
 * Lightbearer: sword/sun/dawn/zenith). Symbols are rendered via hero content
 * `DieFace.label` + a per-symbol glyph map maintained by
 * `content/symbolGlyphs.ts` (not this registry).
 */

export type IconName =
  // UI affordances
  | 'shield'
  | 'heart'
  | 'lock'
  | 'unlock'
  | 'chevron-right'
  | 'chevron-left'
  | 'check'
  | 'cross'
  | 'menu'
  | 'settings'
  | 'scroll-text'      // activity log trigger
  | 'sparkles'         // Radiance
  | 'flame'            // Burn
  | 'zap'              // Stun
  | 'heart-pulse'      // Regen
  | 'droplet'          // Bleeding
  | 'trending-up'      // Empower / positive counter
  | 'arrow-up'         // Frenzy / momentum
  | 'snowflake'        // Frost-bite
  | 'skull'            // Poison-style debuffs
  | 'diamond'          // generic marker / defense card art
  | 'plus'
  | 'minus'
  | 'star'             // generic accent
  | 'flag'             // match end
  | 'info'
