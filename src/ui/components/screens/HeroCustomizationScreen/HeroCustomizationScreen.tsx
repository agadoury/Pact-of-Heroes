/**
 * <HeroCustomizationScreen> — the Collection hub.
 *
 * Ladder + Arsenal builder with an integrated collection/unlock economy:
 *
 *   - LADDER: six slot cards (T1–T4 offense + two defenses). Tapping a slot
 *     slides up a tray of every catalog option for that slot — equipped,
 *     owned (tap to equip), or locked (shows its Renown price; tap to
 *     unlock with a burst when affordable).
 *   - ARSENAL: the 12-card deck as fixed slots grouped by category
 *     (4 generic / 3 dice-manip / 3 masteries / 2 signatures) — the deck is
 *     always composition-valid by construction. Same tray semantics.
 *
 * Every valid change persists instantly (no save button). Renown is earned
 * by playing matches (+3 win / +1 loss, awarded on the match summary).
 *
 * Bible reference: Part 8.6.1 (reworked — collection hub).
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AbilityDef, Card, CardId, HeroId, LoadoutSelection } from '@/game/types'
import { getHero, getCardCatalog } from '@/content'
import { loadLoadout, saveLoadout } from '@/store/loadoutStorage'
import { loadDeck, saveDeck } from '@/store/deckStorage'
import {
  getCollection, unlockAbility, unlockCard, abilityPrice, cardPrice,
} from '@/store/collectionStorage'
import { validateDeckComposition } from '@/game/cards'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import { HeroPortraitArt } from '@/ui/art/heroArt'
import { CardArt } from '@/ui/art/cardArt'
import { clsx } from '@/ui/util/clsx'
import s from './HeroCustomizationScreen.module.css'

// ── slot model ───────────────────────────────────────────────────────────────

type LadderSlot =
  | { kind: 'offense'; tier: 1 | 2 | 3 | 4 }
  | { kind: 'defense'; index: 0 | 1 }

type DeckCategory = Card['cardCategory']

interface DeckSlot { category: DeckCategory; index: number }

const DECK_SHAPE: ReadonlyArray<{ category: DeckCategory; count: number; label: string; blurb: string }> = [
  { category: 'signature',      count: 2, label: 'Signature',  blurb: 'Hero-defining plays' },
  { category: 'ladder-upgrade', count: 3, label: 'Masteries',  blurb: 'Permanent ability upgrades — one per ladder slot' },
  { category: 'dice-manip',     count: 3, label: 'Dice',       blurb: 'Bend the roll' },
  { category: 'generic',        count: 4, label: 'Generic',    blurb: 'Universal staples' },
]

function comboText(combo: AbilityDef['combo']): string {
  switch (combo.kind) {
    case 'symbol-count': {
      const bare = combo.symbol.includes(':') ? combo.symbol.split(':').pop()! : combo.symbol
      return `${combo.count}+ ${bare.charAt(0).toUpperCase()}${bare.slice(1)}`
    }
    case 'n-of-a-kind': return `${combo.count} of a kind`
    case 'straight':    return `Straight of ${combo.length}`
    case 'compound':    return combo.clauses.map(comboText).join(combo.op === 'and' ? ' + ' : ' or ')
    default:            return ''
  }
}

/** Normalize a stored deck into the fixed slot shape. Falls back to the
 *  recommended deck when the stored one doesn't fit the composition. */
function normalizeDeck(heroId: HeroId, stored: CardId[] | null): CardId[] {
  const hero = getHero(heroId)
  const catalog = getCardCatalog(heroId)
  const byId = new Map(catalog.map(c => [c.id, c]))
  const candidate = stored ?? (hero.recommendedDeck as CardId[])
  const cards = candidate.map(id => byId.get(id)).filter(Boolean) as Card[]
  const unique = new Set(candidate).size === candidate.length
  if (cards.length === 12 && unique && validateDeckComposition(cards).length === 0) {
    return candidate
  }
  return hero.recommendedDeck as CardId[]
}

// ── screen ───────────────────────────────────────────────────────────────────

export function HeroCustomizationScreen(): JSX.Element {
  const navigate = useNavigate()
  const { heroId } = useParams<{ heroId: HeroId }>()
  if (!heroId) return <NotFound onBack={() => navigate('/heroes')} />
  let hero
  try { hero = getHero(heroId) } catch { return <NotFound onBack={() => navigate('/heroes')} /> }

  const catalog = useMemo(() => getCardCatalog(heroId), [heroId])
  const cardById = useMemo(() => new Map(catalog.map(c => [c.id as CardId, c])), [catalog])

  const [tab, setTab] = useState<'ladder' | 'arsenal'>('ladder')
  const [loadout, setLoadout] = useState<LoadoutSelection>(() =>
    loadLoadout(heroId) ?? hero.recommendedLoadout,
  )
  const [deck, setDeck] = useState<CardId[]>(() => normalizeDeck(heroId, loadDeck(heroId) as CardId[] | null))
  const [collection, setCollection] = useState(() => getCollection(heroId))
  const [openSlot, setOpenSlot] = useState<LadderSlot | DeckSlot | null>(null)
  // Re-keyed on every equip so the slot pop animation retriggers.
  const [equipPulse, setEquipPulse] = useState<string | null>(null)
  const [burstItem, setBurstItem] = useState<string | null>(null)
  const [shakeItem, setShakeItem] = useState<string | null>(null)

  // Instant persistence — state is valid by construction.
  useEffect(() => {
    if (loadout.offense.length === 4 && loadout.defense.length === 2) saveLoadout(heroId, loadout)
  }, [heroId, loadout])
  useEffect(() => {
    if (deck.length === 12) saveDeck(heroId, deck)
  }, [heroId, deck])

  const refreshCollection = () => setCollection(getCollection(heroId))

  // ── slot content lookups ───────────────────────────────────────────────
  const offenseByTier = useMemo(() => {
    const acc: Partial<Record<1 | 2 | 3 | 4, AbilityDef[]>> = {}
    for (const a of hero.abilityCatalog) (acc[a.tier as 1 | 2 | 3 | 4] ||= []).push(a)
    return acc
  }, [hero])

  const deckSlots = useMemo(() => {
    // Materialize the fixed slot list from the deck ids, grouped by category.
    const grouped: Record<DeckCategory, CardId[]> = {
      'generic': [], 'dice-manip': [], 'ladder-upgrade': [], 'signature': [],
    }
    for (const id of deck) {
      const c = cardById.get(id)
      if (c) grouped[c.cardCategory].push(id)
    }
    return grouped
  }, [deck, cardById])

  // ── equip / unlock actions ─────────────────────────────────────────────
  const equipAbility = (slot: LadderSlot, ability: AbilityDef) => {
    if (slot.kind === 'offense') {
      setLoadout(prev => {
        const offense = [...prev.offense]
        offense[slot.tier - 1] = ability.name
        return { ...prev, offense }
      })
      setEquipPulse(`offense-${slot.tier}-${ability.name}`)
    } else {
      setLoadout(prev => {
        const defense = [...prev.defense] as string[]
        const otherIdx = slot.index === 0 ? 1 : 0
        if (defense[otherIdx] === ability.name) return prev  // no duplicate pair
        defense[slot.index] = ability.name
        return { ...prev, defense }
      })
      setEquipPulse(`defense-${slot.index}-${ability.name}`)
    }
    setOpenSlot(null)
  }

  const equipCard = (slot: DeckSlot, card: Card) => {
    setDeck(prev => {
      if (prev.includes(card.id as CardId)) return prev          // one copy each
      const slotIds = prev.filter(id => cardById.get(id)?.cardCategory === slot.category)
      const replaced = slotIds[slot.index]
      if (!replaced) return prev
      // Mastery slots: one upgrade per ladder tier — refuse a duplicate tier.
      if (slot.category === 'ladder-upgrade') {
        const newTier = card.masteryTier
        const clash = slotIds.some((id, i) =>
          i !== slot.index && cardById.get(id)?.masteryTier === newTier)
        if (clash) return prev
      }
      return prev.map(id => (id === replaced ? (card.id as CardId) : id))
    })
    setEquipPulse(`${slot.category}-${slot.index}-${card.id}`)
    setOpenSlot(null)
  }

  const tryUnlockAbility = (ability: AbilityDef) => {
    if (unlockAbility(heroId, ability)) {
      setBurstItem(`a:${ability.name}`)
      refreshCollection()
      window.setTimeout(() => setBurstItem(null), 700)
    } else {
      setShakeItem(`a:${ability.name}`)
      window.setTimeout(() => setShakeItem(null), 450)
    }
  }

  const tryUnlockCard = (card: Card) => {
    if (unlockCard(heroId, card)) {
      setBurstItem(`c:${card.id}`)
      refreshCollection()
      window.setTimeout(() => setBurstItem(null), 700)
    } else {
      setShakeItem(`c:${card.id}`)
      window.setTimeout(() => setShakeItem(null), 450)
    }
  }

  // ── tray contents for the open slot ────────────────────────────────────
  const trayAbilities: readonly AbilityDef[] | null = useMemo(() => {
    if (!openSlot || !('kind' in openSlot)) return null
    if (openSlot.kind === 'offense') return offenseByTier[openSlot.tier] ?? []
    return hero.defensiveCatalog ?? []
  }, [openSlot, offenseByTier, hero])

  const trayCards: Card[] | null = useMemo(() => {
    if (!openSlot || 'kind' in openSlot) return null
    return catalog.filter(c => c.cardCategory === openSlot.category)
  }, [openSlot, catalog])

  const trayTitle = useMemo(() => {
    if (!openSlot) return ''
    if ('kind' in openSlot) {
      return openSlot.kind === 'offense' ? `Tier ${openSlot.tier} · choose ability` : 'Choose defense'
    }
    return `${DECK_SHAPE.find(d => d.category === openSlot.category)?.label ?? 'Card'} · choose card`
  }, [openSlot])

  const currentAbilityName = (slot: LadderSlot): string =>
    slot.kind === 'offense' ? loadout.offense[slot.tier - 1]! : loadout.defense[slot.index]!

  // ── render ─────────────────────────────────────────────────────────────
  const abilityFor = (name: string): AbilityDef | undefined =>
    hero.abilityCatalog.find(a => a.name === name) ?? hero.defensiveCatalog?.find(a => a.name === name)

  return (
    <div className={s.page} style={{ ['--accent' as string]: hero.accentColor }}>
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate('/heroes')} aria-label="Back">‹</button>
        <span className={s.orb}><HeroPortraitArt heroId={heroId} size={40} /></span>
        <div className={s.headText}>
          <div className={s.title}>{hero.name}</div>
          <div className={s.subtitle}>{collection.ownedCount}/{collection.collectibleCount} collected</div>
        </div>
        <div className={s.renown} data-testid="renown">
          <Icon name="sparkles" size={12} />
          <span key={collection.renown} className={s.renownValue}>{collection.renown}</span>
        </div>
      </header>

      <div className={s.tabs}>
        <button className={clsx(s.tab, tab === 'ladder' && s.active)} onClick={() => setTab('ladder')}>Ladder</button>
        <button className={clsx(s.tab, tab === 'arsenal' && s.active)} onClick={() => setTab('arsenal')}>Arsenal</button>
      </div>

      {tab === 'ladder' ? (
        <div className={s.scroll}>
          <div className={s.sectionLabel}>Offense — one ability per tier</div>
          {([4, 3, 2, 1] as const).map(tier => {
            const name = loadout.offense[tier - 1]!
            const a = abilityFor(name)
            return (
              <SlotCard
                key={`o-${tier}`}
                pulseKey={equipPulse}
                pulseId={`offense-${tier}-${name}`}
                tier={tier}
                title={name}
                combo={a ? comboText(a.combo) : ''}
                text={a?.shortText ?? ''}
                onTap={() => setOpenSlot({ kind: 'offense', tier })}
              />
            )
          })}
          <div className={s.sectionLabel}>Defense — pick two</div>
          {([0, 1] as const).map(idx => {
            const name = loadout.defense[idx]!
            const a = abilityFor(name)
            return (
              <SlotCard
                key={`d-${idx}`}
                pulseKey={equipPulse}
                pulseId={`defense-${idx}-${name}`}
                tier={(a?.tier ?? 1) as 1 | 2 | 3 | 4}
                title={name}
                combo={a ? comboText(a.combo) : ''}
                text={a?.shortText ?? ''}
                defense
                onTap={() => setOpenSlot({ kind: 'defense', index: idx })}
              />
            )
          })}
        </div>
      ) : (
        <div className={s.scroll}>
          {DECK_SHAPE.map(({ category, count, label, blurb }) => (
            <section key={category}>
              <div className={s.sectionLabel}>{label} <span className={s.blurb}>· {blurb}</span></div>
              <div className={s.cardGrid}>
                {Array.from({ length: count }, (_, i) => {
                  const id = deckSlots[category][i]
                  const card = id ? cardById.get(id) : undefined
                  return (
                    <button
                      key={`${category}-${i}`}
                      className={clsx(s.deckSlot, equipPulse === `${category}-${i}-${id}` && s.pop)}
                      onClick={() => setOpenSlot({ category, index: i })}
                      data-testid={`deck-slot-${category}-${i}`}
                    >
                      {card ? (
                        <>
                          <span className={s.deckArt}><CardArt cardId={card.id} /></span>
                          <span className={s.deckCost}>{card.cost}</span>
                          <span className={s.deckName}>{card.name}</span>
                          {card.masteryTier != null ? (
                            <span className={s.deckTier}>{card.masteryTier === 'defensive' ? 'DEF' : `T${card.masteryTier}`}</span>
                          ) : null}
                        </>
                      ) : (
                        <span className={s.deckEmpty}>+</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {openSlot ? (
        <div className={s.trayBackdrop} onClick={() => setOpenSlot(null)}>
          <div className={s.tray} data-overlay="collection-tray" onClick={e => e.stopPropagation()}>
            <div className={s.trayHandle} />
            <div className={s.trayTitle}>{trayTitle}</div>
            <div className={s.trayList}>
              {trayAbilities?.map(a => {
                const owned = collection.ownedAbilities.has(a.name)
                const equipped = 'kind' in openSlot! && currentAbilityName(openSlot as LadderSlot) === a.name
                const inOtherSlot =
                  ('kind' in openSlot! && (openSlot as LadderSlot).kind === 'defense')
                  && loadout.defense.includes(a.name) && !equipped
                const price = abilityPrice(a)
                const burstKey = `a:${a.name}`
                return (
                  <button
                    key={a.name}
                    className={clsx(
                      s.option, equipped && s.equipped, !owned && s.locked,
                      burstItem === burstKey && s.burst, shakeItem === burstKey && s.shake,
                    )}
                    disabled={equipped || inOtherSlot}
                    onClick={() =>
                      owned
                        ? equipAbility(openSlot as LadderSlot, a)
                        : tryUnlockAbility(a)}
                  >
                    <span className={clsx(s.optTier, s[`t${a.tier}`])}>T{a.tier}</span>
                    <span className={s.optBody}>
                      <span className={s.optName}>{a.name}</span>
                      <span className={s.optCombo}>{comboText(a.combo)}</span>
                      <span className={s.optText}>{a.shortText}</span>
                    </span>
                    <OptionState owned={owned} equipped={equipped} dimmed={inOtherSlot} price={price} affordable={collection.renown >= price} />
                  </button>
                )
              })}
              {trayCards?.map(c => {
                const owned = collection.ownedCards.has(c.id as CardId)
                const equipped = deck.includes(c.id as CardId)
                const price = cardPrice(c)
                const burstKey = `c:${c.id}`
                return (
                  <button
                    key={c.id}
                    className={clsx(
                      s.option, equipped && s.equipped, !owned && s.locked,
                      burstItem === burstKey && s.burst, shakeItem === burstKey && s.shake,
                    )}
                    disabled={equipped}
                    onClick={() =>
                      owned
                        ? equipCard(openSlot as DeckSlot, c)
                        : tryUnlockCard(c)}
                  >
                    <span className={s.optArt}><CardArt cardId={c.id} /></span>
                    <span className={s.optBody}>
                      <span className={s.optName}>{c.name} <span className={s.optCost}>{c.cost} CP</span></span>
                      <span className={s.optText}>{c.text}</span>
                    </span>
                    <OptionState owned={owned} equipped={equipped} price={price} affordable={collection.renown >= price} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ── bits ─────────────────────────────────────────────────────────────────────

function SlotCard(props: {
  tier: 1 | 2 | 3 | 4
  title: string
  combo: string
  text: string
  defense?: boolean
  pulseKey: string | null
  pulseId: string
  onTap: () => void
}): JSX.Element {
  return (
    <button
      className={clsx(s.slotCard, props.pulseKey === props.pulseId && s.pop)}
      onClick={props.onTap}
      data-testid={`slot-${props.defense ? 'def' : 'off'}-${props.tier}`}
    >
      <span className={clsx(s.slotTier, s[`t${props.tier}`], props.defense && s.def)}>
        {props.defense ? 'DEF' : `T${props.tier}`}
      </span>
      <span className={s.slotBody}>
        <span className={s.slotName}>{props.title}</span>
        <span className={s.slotCombo}>{props.combo}</span>
        <span className={s.slotText}>{props.text}</span>
      </span>
      <span className={s.slotChevron}>›</span>
    </button>
  )
}

function OptionState(props: { owned: boolean; equipped: boolean; dimmed?: boolean; price: number; affordable: boolean }): JSX.Element {
  if (props.equipped) return <span className={clsx(s.state, s.stateEquipped)}><Icon name="check" size={11} /> Equipped</span>
  if (props.dimmed)   return <span className={clsx(s.state, s.stateDim)}>In use</span>
  if (props.owned)    return <span className={clsx(s.state, s.stateOwned)}>Equip</span>
  return (
    <span className={clsx(s.state, props.affordable ? s.stateUnlock : s.stateLocked)}>
      <Icon name="lock" size={10} /> {props.price} <Icon name="sparkles" size={10} />
    </span>
  )
}

function NotFound({ onBack }: { onBack: () => void }): JSX.Element {
  return (
    <div className={s.notFound}>
      <div>Hero not found.</div>
      <Button variant="default" onClick={onBack}>Back</Button>
    </div>
  )
}

export default HeroCustomizationScreen
