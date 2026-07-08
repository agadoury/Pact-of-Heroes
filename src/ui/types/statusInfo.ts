/**
 * Player-facing descriptions for every buff/debuff token and passive
 * counter. Tapping a chip in the status track opens a tooltip built from
 * this registry. Numbers here must track the engine content — update
 * alongside balance changes (see HANDOFF "Balance state").
 *
 * Bible reference: Part 6.3 (tooltip grammar).
 */

import type { TooltipContent } from './tooltip'

interface StatusInfo {
  name: string
  /** 'buff' | 'debuff' | 'counter' — shown as a prefix so players learn
   *  valence without color literacy. */
  kind: 'Buff' | 'Debuff' | 'Resource'
  body: string
  /** Unit word for the count in the title (default "stacks"). */
  unit?: string
}

const STATUS_INFO: Record<string, StatusInfo> = {
  // ── Universal statuses ────────────────────────────────────────────────
  burn: {
    name: 'Burn', kind: 'Debuff',
    body: 'At your upkeep: take damage equal to current stacks, then 1 stack fades.',
  },
  stun: {
    name: 'Stun', kind: 'Debuff',
    body: 'Your next roll phase is skipped entirely — no dice, no attack. The Resolve card (1 CP) shakes it off.',
  },
  protect: {
    name: 'Protect', kind: 'Buff',
    body: 'Warding tokens. Incoming hits consume them — each token spent prevents 2 damage.',
    unit: 'tokens',
  },
  shield: {
    name: 'Shield', kind: 'Buff',
    body: 'A steady barrier: every incoming hit is reduced by 1 per stack. Never consumed.',
  },
  regen: {
    name: 'Regen', kind: 'Buff',
    body: 'At your upkeep: heal HP equal to current stacks, then 1 stack fades.',
  },
  bleeding: {
    name: 'Bleeding', kind: 'Debuff',
    body: 'An open wound that drains life over time.',
  },

  // ── Passive counters ─────────────────────────────────────────────────
  radiance: {
    name: 'Radiance', kind: 'Resource',
    body: 'Banked light (max 6). Spend while attacking for +1 damage or +1 heal per token, or while defending for −1 incoming damage per token.',
    unit: 'tokens',
  },
  frenzy: {
    name: 'Frenzy', kind: 'Resource',
    body: 'The wound is the door (max 6). Every stack adds +1 damage to all your offensive abilities. Gained by taking ability damage (at most +1 per turn).',
  },

  // ── Hero signature tokens ────────────────────────────────────────────
  'berserker:frostbite': {
    name: 'Frost-bite', kind: 'Debuff',
    body: 'Deep cold (max 4). At your upkeep: take 1 damage, then 1 stack thaws. While it lasts, your offensive abilities deal −1 damage per stack.',
  },
  'pyromancer:cinder': {
    name: 'Cinder', kind: 'Debuff',
    body: 'The mountain’s mark (max 5). At 5 stacks it detonates for 10 undefendable damage (14 under Crater Wind), then resets to 0. Removing stacks pays the Pyromancer 1 CP each.',
  },
  'pyromancer:defense-handicap-1': {
    name: 'Smouldering Stone', kind: 'Debuff',
    body: 'Your next defensive roll uses 1 fewer die. Crumbles after that roll.',
  },
  'lightbearer:verdict': {
    name: 'Verdict', kind: 'Debuff',
    body: 'Judged (max 4). Your offensive abilities deal −2 damage per stack (capped at −3 total), and the Lightbearer gains 1 CP whenever you attack. At 3+ stacks your main-phase and instant cards are blocked for a turn. Atone during your Main Phase (2 CP) to remove all stacks.',
  },
}

/** Build tooltip content for a status/counter chip. Unknown ids get a
 *  graceful fallback so a future token never renders a dead tap. */
export function statusTooltip(effect: string, count?: number): TooltipContent {
  const info = STATUS_INFO[effect]
  if (!info) {
    return { kind: 'free-text', title: effect, body: 'No description available.' }
  }
  const unit = info.unit ?? 'stacks'
  const countSuffix = count != null && count > 0 ? ` · ${count} ${count === 1 ? unit.replace(/s$/, '') : unit}` : ''
  return {
    kind: 'free-text',
    title: `${info.name}${countSuffix}`,
    body: `${info.kind} — ${info.body}`,
  }
}
