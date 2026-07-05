/**
 * StatusTrack selector — engine snapshot → chip lists for the strip.
 *
 * Groups by valence (positive left, negative right) per the bible's Part 4.6
 * grammar. Handles universal statuses, hero-namespaced signature statuses,
 * passive-counter chips (Frenzy / Radiance), and card buffs.
 *
 * Bible reference: Parts 4.4–4.7.
 */

import type { HeroSnapshot, StatusInstance } from '@/game/types'
import {
  CHIP_VALENCE,
  SIGNATURE_KIND_FROM_STATUS_ID,
  type ChipEffect,
  type StatusToken,
  type SignatureKind,
  type Valence,
} from '@/ui/types/status'

export interface DeriveStatusTrackResult {
  positive:      StatusToken[]     // buffs + resource counters on strip owner
  negative:      StatusToken[]     // debuffs + opponent-applied signatures
  signatures:    SignatureChipEntry[]
  overflowCount: number
}

export interface SignatureChipEntry {
  kind:      SignatureKind
  count:     number
  threshold: boolean            // cinder ≥ 5
}

const DEFAULT_MAX_VISIBLE = 5

export function deriveStatusTrack(
  snapshot: HeroSnapshot,
  opts: { maxVisible?: number } = {},
): DeriveStatusTrackResult {
  const maxVisible = opts.maxVisible ?? DEFAULT_MAX_VISIBLE

  const positive: StatusToken[] = []
  const negative: StatusToken[] = []
  const signatures: SignatureChipEntry[] = []

  // 1. Universal + hero-namespaced statuses
  for (const st of snapshot.statuses) {
    const signatureKind = SIGNATURE_KIND_FROM_STATUS_ID[st.id]
    if (signatureKind) {
      signatures.push({
        kind:      signatureKind,
        count:     st.stacks,
        threshold: signatureKind === 'cinder' && st.stacks >= 5,
      })
      // Also push into negative bucket for track-layout counting.
      negative.push(statusToToken(st, 'negative'))
      continue
    }
    const effect = st.id as ChipEffect
    const valence = CHIP_VALENCE[effect] ?? 'neutral'
    const token = statusToToken(st, valence)
    if (valence === 'positive') positive.push(token)
    else if (valence === 'negative') negative.push(token)
  }

  // 2. Passive counter chips (Frenzy / Radiance) from signatureState
  for (const [key, count] of Object.entries(snapshot.signatureState)) {
    if (count <= 0) continue
    if (key === 'radiance' || key === 'frenzy') {
      positive.push({
        effect:    key,
        count,
        appliedAt: 0,
      })
    }
  }

  // 3. Overflow computation
  const total = positive.length + negative.length
  const overflowCount = Math.max(0, total - maxVisible)

  return { positive, negative, signatures, overflowCount }
}

function statusToToken(st: StatusInstance, _valence: Valence): StatusToken {
  return {
    effect:    st.id as ChipEffect,
    count:     st.stacks,
    appliedAt: 0,   // engine doesn't track applied-at yet; ordering by array position
    appliedBy: st.appliedBy,
  }
}
