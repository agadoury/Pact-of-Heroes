/**
 * <ArtPreview> — internal gallery for visual QA of the art layer.
 * Route: /art-preview (dev builds only; the route stays but renders a
 * notice in production).
 */

import type { HeroId } from '@/game/types'
import { HeroPortraitArt } from '@/ui/art/heroArt'
import { CardArt, CARD_ART_IDS } from '@/ui/art/cardArt'

const HEROES: HeroId[] = ['berserker', 'pyromancer', 'lightbearer']

export function ArtPreview(): JSX.Element {
  return (
    <div style={{ background: '#0a0a14', height: '100vh', padding: 16, color: '#d8d4c0', fontFamily: 'sans-serif', overflowY: 'auto' }}>
      <h2 style={{ fontSize: 14 }}>Portraits · 120 / 64 / 44 (orb crop)</h2>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }} data-testid="portraits">
        {HEROES.map(h => (
          <div key={h} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <HeroPortraitArt heroId={h} size={120} />
            <HeroPortraitArt heroId={h} size={64} />
            <span style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', display: 'inline-block', border: '1px solid #d4a548' }}>
              <HeroPortraitArt heroId={h} size={44} />
            </span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 14, marginTop: 20 }}>Card art · {CARD_ART_IDS.length} cards</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }} data-testid="cards">
        {CARD_ART_IDS.map(id => (
          <div key={id} style={{ border: '1px solid #333', borderRadius: 6, overflow: 'hidden' }}>
            <CardArt cardId={id} />
            <div style={{ fontSize: 8, padding: '2px 4px', color: '#88826c' }}>{id}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ArtPreview
