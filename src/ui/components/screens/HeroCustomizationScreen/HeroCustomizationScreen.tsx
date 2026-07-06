/**
 * <HeroCustomizationScreen>
 *
 * Tabbed abilities + deck editor for a hero. Reads/writes engine's
 * LoadoutSelection + CardId[] deck via the existing storage layer.
 *
 * Bible reference: Part 8.6.1.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AbilityDef, AbilityTier, CardId, HeroId, LoadoutSelection } from '@/game/types'
import { getHero, getCardCatalog } from '@/content'
import { loadLoadout, saveLoadout } from '@/store/loadoutStorage'
import { loadDeck, saveDeck } from '@/store/deckStorage'
import { Button } from '@/ui/components/atoms/Button'
import { clsx } from '@/ui/util/clsx'
import s from './HeroCustomizationScreen.module.css'

const DECK_SIZE = 12
const MAX_COPIES = 2

export function HeroCustomizationScreen(): JSX.Element {
  const navigate = useNavigate()
  const { heroId } = useParams<{ heroId: HeroId }>()
  if (!heroId) return <NotFound onBack={() => navigate('/heroes')} />
  let hero
  try { hero = getHero(heroId) } catch { return <NotFound onBack={() => navigate('/heroes')} /> }

  const [tab, setTab]           = useState<'abilities' | 'deck'>('abilities')
  const [loadout, setLoadout]   = useState<LoadoutSelection>(() =>
    loadLoadout(heroId) ?? hero.recommendedLoadout,
  )
  const [deck, setDeck]         = useState<CardId[]>(() =>
    (loadDeck(heroId) ?? hero.recommendedDeck) as CardId[],
  )

  // Persist only VALID selections — a half-edited state (1 defense,
  // 8-card deck) would either be silently discarded by the engine or, for
  // decks, played as-is. Invalid intermediate states live only in local
  // component state until completed.
  useEffect(() => {
    if (loadout.offense.length === 4 && loadout.defense.length === 2) {
      saveLoadout(heroId, loadout)
    }
  }, [heroId, loadout])
  useEffect(() => {
    if (deck.length === DECK_SIZE) saveDeck(heroId, deck)
  }, [heroId, deck])

  const catalogByTier = useMemo(() => {
    const acc: Partial<Record<AbilityTier, AbilityDef[]>> = {}
    for (const a of hero.abilityCatalog) (acc[a.tier] ||= []).push(a)
    return acc
  }, [hero])

  const defensiveCatalog = hero.defensiveCatalog ?? []

  const setOffenseTier = (tier: 1 | 2 | 3 | 4, name: string) => {
    setLoadout(prev => {
      const nextOffense = [...prev.offense]
      const targetIdx = (tier - 1)
      nextOffense[targetIdx] = name
      return { ...prev, offense: nextOffense }
    })
  }

  const toggleDefense = (name: string) => {
    setLoadout(prev => {
      const cur = new Set(prev.defense)
      if (cur.has(name)) {
        cur.delete(name)
      } else if (cur.size < 2) {
        cur.add(name)
      } else {
        // Replace the first entry.
        cur.delete(prev.defense[0]!)
        cur.add(name)
      }
      return { ...prev, defense: Array.from(cur) }
    })
  }

  const cardCatalog = useMemo(() => getCardCatalog(heroId), [heroId])

  const cardCounts = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const id of deck) acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, [deck])

  const addCard = (id: CardId) => {
    if (deck.length >= DECK_SIZE) return
    if ((cardCounts[id] ?? 0) >= MAX_COPIES) return
    setDeck(prev => [...prev, id])
  }
  const removeCard = (id: CardId) => {
    setDeck(prev => {
      const idx = prev.lastIndexOf(id)
      if (idx < 0) return prev
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })
  }
  const fillDefaults = () => {
    const needed = DECK_SIZE - deck.length
    if (needed <= 0) return
    // Pool: recommended deck first, then the full catalog — the recommended
    // list alone can run dry when its ids are already at the copy cap,
    // leaving the deck short with no feedback.
    const counts = { ...cardCounts }
    const fill: CardId[] = []
    const pool = [...hero.recommendedDeck, ...cardCatalog.map(c => c.id)] as CardId[]
    for (const id of pool) {
      if (fill.length >= needed) break
      if ((counts[id] ?? 0) >= MAX_COPIES) continue
      counts[id] = (counts[id] ?? 0) + 1
      fill.push(id)
    }
    setDeck(prev => [...prev, ...fill])
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <button className={s.back} onClick={() => navigate(-1)}>‹ Back</button>
        <div className={s.title}>{hero.name}</div>
      </header>

      <div className={s.tabs}>
        <button
          className={clsx(s.tab, tab === 'abilities' && s.active)}
          onClick={() => setTab('abilities')}
        >
          Abilities
        </button>
        <button
          className={clsx(s.tab, tab === 'deck' && s.active)}
          onClick={() => setTab('deck')}
        >
          Deck
          <span
            className={clsx(s.badge, deck.length === DECK_SIZE ? s.badgeReady : s.badgeShort)}
          >
            {deck.length}/{DECK_SIZE}
          </span>
        </button>
      </div>

      {tab === 'abilities' ? (
        <div className={s.section}>
          {[4, 3, 2, 1].map(tier => {
            const abils = catalogByTier[tier as AbilityTier] ?? []
            const currentPick = loadout.offense[tier - 1]
            return (
              <section key={tier} className={s.tierSection}>
                <div className={s.eyebrow}>
                  Tier {tier} · Current: {currentPick}
                </div>
                <div className={s.abilityList}>
                  {abils.map(a => (
                    <button
                      key={a.name}
                      className={clsx(s.abilityRow, currentPick === a.name && s.pick)}
                      onClick={() => setOffenseTier(tier as 1 | 2 | 3 | 4, a.name)}
                    >
                      <span className={s.abilityName}>{a.name}</span>
                      <span className={s.abilityText}>{a.shortText}</span>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}

          <section className={s.tierSection}>
            <div className={s.eyebrow}>Defenses · {loadout.defense.length} of 2 picked</div>
            <div className={s.abilityList}>
              {defensiveCatalog.map(d => {
                const picked = loadout.defense.includes(d.name)
                return (
                  <button
                    key={d.name}
                    className={clsx(s.abilityRow, picked && s.pick)}
                    onClick={() => toggleDefense(d.name)}
                  >
                    <span className={s.abilityName}>{d.name}</span>
                    <span className={s.abilityText}>{d.shortText}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className={s.section}>
          <div className={s.deckColumns}>
            <section className={s.deckCol}>
              <div className={s.eyebrow}>Your Deck</div>
              <div className={s.deckList}>
                {deck.length === 0 ? (
                  <div className={s.empty}>Empty — add cards from the right.</div>
                ) : (
                  Object.entries(cardCounts).map(([id, count]) => {
                    const card = cardCatalog.find(c => c.id === id)
                    if (!card) return null
                    return (
                      <div key={id} className={s.deckRow}>
                        <span className={s.cardCost}>{card.cost}</span>
                        <span className={s.cardName}>{card.name} ×{count}</span>
                        <button className={s.removeBtn} onClick={() => removeCard(id as CardId)}>−</button>
                      </div>
                    )
                  })
                )}
              </div>
              {deck.length < DECK_SIZE ? (
                <Button variant="default" onClick={fillDefaults}>
                  Fill with defaults
                </Button>
              ) : null}
            </section>

            <section className={s.deckCol}>
              <div className={s.eyebrow}>Available</div>
              <div className={s.deckList}>
                {cardCatalog.map(c => {
                  const cur = cardCounts[c.id] ?? 0
                  const capped = cur >= MAX_COPIES
                  return (
                    <div key={c.id} className={s.deckRow}>
                      <span className={s.cardCost}>{c.cost}</span>
                      <span className={s.cardName}>
                        {c.name} ({cur}/{MAX_COPIES})
                      </span>
                      <button
                        className={clsx(s.addBtn, capped && s.disabled)}
                        onClick={() => addCard(c.id as CardId)}
                        disabled={capped || deck.length >= DECK_SIZE}
                      >
                        +
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
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
