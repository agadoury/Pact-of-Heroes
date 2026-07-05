/**
 * ResolvedEvent — the UI-side notification that a resolution completed
 * and is ready to be cinematic-ized.
 *
 * The FOPScene aggregator writes these into uiStore.lastResolvedEvent.
 * The FieldOfPlay component subscribes to that field and dedupes on `id`.
 */

import type { EventId } from './ui'
import type { FOPScene } from './fop'

export interface ResolvedEvent {
  id:        EventId
  scene:     FOPScene
  timestamp: number
}
