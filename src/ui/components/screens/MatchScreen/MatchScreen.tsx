/**
 * <MatchScreen>
 *
 * The rebuilt live match screen. Wires every band + ladder + FOP +
 * overlays against gameStore and uiStore. Dispatches engine actions
 * on user input via the action selectors.
 *
 * Bible references: Parts 2, 3, 5, 6, 7.
 */

import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameState, HeroSnapshot, PlayerId } from '@/game/types'
import { useGameStore } from '@/store/gameStore'
import { useUIStore, wireResolutionBridge } from '@/ui/store/uiStore'
import { useResolutionDriver } from '@/ui/hooks/useResolutionDriver'
import { ScreenBands } from '@/ui/components/shared/ScreenBands'
import { HeroStrip } from '@/ui/components/bands/HeroStrip'
import { PhaseBanner } from '@/ui/components/bands/PhaseBanner'
import { DiceTray } from '@/ui/components/bands/DiceTray'
import { MiddleBand } from '@/ui/components/bands/MiddleBand'
import { Hand } from '@/ui/components/bands/Hand'
import { HandCard } from '@/ui/components/bands/HandCard'
import { ActionBar } from '@/ui/components/bands/ActionBar'
import { DeckIndicator } from '@/ui/components/bands/DeckIndicator'
import { OpponentHandIndicator } from '@/ui/components/bands/OpponentHandIndicator'
import { AbilityLadder } from '@/ui/components/ladder/AbilityLadder'
import { StatusTrack } from '@/ui/components/tokens/StatusTrack'
import { FieldOfPlay } from '@/ui/components/fop/FieldOfPlay'
import { UltimateTakeover } from '@/ui/components/fop/UltimateTakeover'
import { DefensiveOverlay } from '@/ui/components/overlays/DefensiveOverlay'
import { SpendOverlay } from '@/ui/components/overlays/SpendOverlay'
import { ExpandedAbilityView } from '@/ui/components/overlays/ExpandedAbilityView'
import { ExpandedCardView } from '@/ui/components/overlays/ExpandedCardView'
import { TooltipRenderer } from '@/ui/components/overlays/TooltipRenderer'
import { ToastQueue, toast } from '@/ui/components/overlays/ToastQueue'
import { ActivityLog } from '@/ui/components/overlays/ActivityLog'
import { derivePhaseDisplay } from '@/ui/selectors/phaseDisplay'
import { deriveLadder } from '@/ui/selectors/ladder'
import { deriveStatusTrack } from '@/ui/selectors/statusTrack'
import { deriveActionBar } from '@/ui/selectors/actionBar'
import { withRollingFlag, type UiDie } from '@/ui/selectors/derivePips'
import s from './MatchScreen.module.css'

export function MatchScreen(): JSX.Element {
  const navigate = useNavigate()
  const state    = useGameStore(g => g.state)
  const dispatch = useGameStore(g => g.dispatch)
  const viewerId = useUIStore(u => u.viewerId)
  const uiOverlay      = useUIStore(u => u.activeOverlay)
  const currentRes     = useUIStore(u => u.currentResolution)
  const resolutionPhase = useUIStore(u => u.resolutionPhase)
  const selectedAbilityId  = useUIStore(u => u.selectedAbilityId)
  const focusedCardId      = useUIStore(u => u.focusedCardId)
  const selectedDefenseId  = useUIStore(u => u.selectedDefenseId)
  const setOverlay         = useUIStore(u => u.setOverlay)
  const selectAbility      = useUIStore(u => u.selectAbility)
  const selectDefense      = useUIStore(u => u.selectDefense)
  const focusCard          = useUIStore(u => u.focusCard)

  // Wire event bridge once.
  useEffect(() => {
    const unsub = wireResolutionBridge()
    return unsub
  }, [])

  // Drive queued resolutions.
  useResolutionDriver()

  // Redirect to summary when match ends.
  useEffect(() => {
    if (state?.phase === 'match-end') {
      navigate('/summary')
    }
  }, [state?.phase, navigate])

  if (!state) {
    return <NoMatch onGoHome={() => navigate('/')} />
  }

  const opponent = state.players[viewerId === 'p1' ? 'p2' : 'p1']
  const self     = state.players[viewerId]
  const opponentId: PlayerId = viewerId === 'p1' ? 'p2' : 'p1'
  const phaseDisplay = derivePhaseDisplay(state, viewerId)
  const opponentTracks = deriveStatusTrack(opponent)
  const selfTracks     = deriveStatusTrack(self)

  const activeSnapshot: HeroSnapshot = state.players[state.activePlayer]
  const uiDice: UiDie[] = withRollingFlag(activeSnapshot.dice, {})
  const ladder = deriveLadder({
    self:     activeSnapshot,
    opponent: state.players[state.activePlayer === 'p1' ? 'p2' : 'p1'],
    dice:     uiDice,
    viewerId,
  })

  const isViewerTurn   = state.activePlayer === viewerId
  const resolutionActive = uiOverlay === 'ultimate' || currentRes?.scene.kind === 'ability'
  const actionBar = deriveActionBar({
    state,
    viewerId,
    activeOverlay: uiOverlay,
    resolutionActive,
  })

  const selectedAbility = ladder.find(a => a.id === selectedAbilityId) ?? null
  const focusedCard = self.hand.find(c => c.id === focusedCardId) ?? null

  // Handlers -------------------------------------------------------------

  const onDieTap = (index: number) => {
    if (!isViewerTurn) return
    dispatch({ kind: 'toggle-die-lock', die: index as 0|1|2|3|4 })
  }

  const onActionTap = (id: string) => {
    switch (id) {
      case 'roll':
        return dispatch({ kind: 'roll-dice' })
      case 'end-turn':
      case 'skip-turn':
        return dispatch({ kind: 'end-turn' })
      case 'confirm-defense':
        if (state.pendingAttack) {
          const idx = self.activeDefense.findIndex(a => a.name === selectedDefenseId)
          dispatch({ kind: 'select-defense', abilityIndex: idx >= 0 ? idx : null })
          selectDefense(null)
        }
        return
      case 'confirm-spend':
        dispatch({ kind: 'spend-bank', amount: 1 })
        return
      case 'skip-spend':
        dispatch({ kind: 'decline-bank-spend' })
        return
      case 'confirm-ability':
        // Handled via ExpandedAbilityView flow
        return
    }
  }

  const onRowTap = (abilityId: string) => {
    selectAbility(abilityId)
    setOverlay('ability')
  }

  const onCardTap = (cardId: string) => {
    focusCard(cardId)
    setOverlay('card')
  }

  const onActivateAbility = () => {
    if (!selectedAbility) return
    const idx = self.activeOffense.findIndex(a => a.name === selectedAbility.id)
    if (idx < 0) {
      toast('warn', 'Ability not on the ladder')
      return
    }
    setOverlay('none')
    selectAbility(null)
    dispatch({ kind: 'select-offensive-ability', abilityIndex: idx })
  }

  const onPlayCard = () => {
    if (!focusedCard) return
    setOverlay('none')
    focusCard(null)
    dispatch({ kind: 'play-card', card: focusedCard.id, casterPlayer: viewerId })
  }

  const onCancelOverlay = () => {
    setOverlay('none')
    selectAbility(null)
    focusCard(null)
  }

  // Derived overlay props ------------------------------------------------

  const defensiveOptions = useMemo(() => {
    if (!state.pendingAttack || state.pendingAttack.defender !== viewerId) return []
    return self.activeDefense.map((d) => ({
      id:         d.name,
      name:       d.name,
      effectText: d.shortText,
      descriptor: { kind: 'sigil' as const, symbols: comboSymbolList(d.combo) },
      comboState: { status: 'ineligible' as const, pips: comboOutlinedPips(d.combo) },
      diceCount:  d.defenseDiceCount ?? 3,
    }))
  }, [state.pendingAttack, self.activeDefense, viewerId])

  const spendOptions = useMemo(() => {
    if (!state.pendingBankSpend) return []
    return [
      { id: 'damage-bonus',    cost: 1, name: 'Empower attack',   effect: '+2 damage per token',    affordable: state.pendingBankSpend.available >= 1 },
      { id: 'heal-self',       cost: 1, name: 'Heal self',        effect: '+1 HP per token',        affordable: state.pendingBankSpend.available >= 1 },
      { id: 'reduce-incoming', cost: 1, name: 'Reduce incoming',  effect: '-2 damage per token',    affordable: state.pendingBankSpend.available >= 1 },
    ]
  }, [state.pendingBankSpend])

  // Render ---------------------------------------------------------------

  return (
    <ScreenBands>
      <div className={s.band} data-band="opp-strip">
        <HeroStrip
          playerId={opponentId}
          viewerId={viewerId}
          snapshot={opponent}
          nameRowRight={
            <>
              <OpponentHandIndicator count={opponent.hand.length} />
              <DeckIndicator count={opponent.deck.length} variant="opp" />
            </>
          }
          statusTrackSlot={
            <StatusTrack
              positive={opponentTracks.positive}
              negative={opponentTracks.negative}
              signatures={opponentTracks.signatures}
              overflowCount={opponentTracks.overflowCount}
            />
          }
        />
      </div>

      <div className={s.band} data-band="phase-banner">
        <PhaseBanner phase={phaseDisplay} onOpenLog={() => setOverlay('log')} />
      </div>

      <div className={s.band} data-band="dice-tray">
        <DiceTray
          dice={activeSnapshot.dice}
          isRolling={false}
          interactable={isViewerTurn}
          heroId={activeSnapshot.hero}
          onDieTap={onDieTap}
        />
      </div>

      <div className={s.band} data-band="middle">
        <MiddleBand>
          <AbilityLadder
            abilities={ladder}
            opacity={currentRes ? 0.1 : 1}
            onRowTap={onRowTap}
            interactable={!currentRes}
          />
          <FieldOfPlay
            active={!!currentRes}
            scene={currentRes?.scene ?? null}
            phase={resolutionPhase}
          />
        </MiddleBand>
      </div>

      <div className={s.band} data-band="self-strip">
        <HeroStrip
          playerId={viewerId}
          viewerId={viewerId}
          snapshot={self}
          nameRowRight={<DeckIndicator count={self.deck.length} />}
          statusTrackSlot={
            <StatusTrack
              positive={selfTracks.positive}
              negative={selfTracks.negative}
              signatures={selfTracks.signatures}
              overflowCount={selfTracks.overflowCount}
            />
          }
        />
      </div>

      <div className={s.band} data-band="hand">
        <Hand>
          {self.hand.map((card, idx) => (
            <HandCard
              key={card.id + '-' + idx}
              card={card}
              position={idx}
              state={cardPlayableState(state, self, card, isViewerTurn, uiOverlay)}
              focused={focusedCardId === card.id}
              onTap={() => onCardTap(card.id)}
            />
          ))}
        </Hand>
      </div>

      <div className={s.band} data-band="action-bar">
        <ActionBar
          buttons={actionBar.map(b => ({
            ...b,
            onTap: () => onActionTap(b.id),
          }))}
        />
      </div>

      {/* Overlays --------------------------------------------------- */}

      <DefensiveOverlay
        active={uiOverlay !== 'ability' && !!state.pendingAttack && state.pendingAttack.defender === viewerId}
        incoming={{
          damage:      state.pendingAttack?.incomingAmount ?? 0,
          sourceLabel: `${state.pendingAttack?.abilityName ?? ''} · T${state.pendingAttack?.tier ?? ''}`,
        }}
        options={defensiveOptions}
        selectedId={selectedDefenseId}
        onSelect={selectDefense}
      />

      <SpendOverlay
        active={!!state.pendingBankSpend && state.pendingBankSpend.holder === viewerId}
        resourceName="Radiance"
        available={state.pendingBankSpend?.available ?? 0}
        max={6}
        options={spendOptions}
        onSelect={(id) => { void id }}
      />

      <ExpandedAbilityView
        active={uiOverlay === 'ability' && !!selectedAbility}
        ability={selectedAbility}
        activatable={isViewerTurn && selectedAbility?.comboState.status === 'eligible'}
        readOnly={!isViewerTurn}
        unactivatableReason={
          !isViewerTurn ? 'NOT YOUR TURN'
          : selectedAbility?.comboState.status !== 'eligible' ? 'COMBO NOT MET'
          : undefined
        }
        onCancel={onCancelOverlay}
        onActivate={onActivateAbility}
      />

      <ExpandedCardView
        active={uiOverlay === 'card' && !!focusedCard}
        card={focusedCard}
        affordable={focusedCard != null && self.cp >= focusedCard.cost}
        playable={focusedCard != null && self.cp >= focusedCard.cost && (
          isViewerTurn || focusedCard.kind === 'instant'
        )}
        unplayableReason={
          focusedCard && self.cp < focusedCard.cost
            ? `NEED ${focusedCard.cost} CP (HAVE ${self.cp})`
            : !isViewerTurn && focusedCard?.kind !== 'instant'
              ? 'NOT YOUR TURN'
              : undefined
        }
        onCancel={onCancelOverlay}
        onPlay={onPlayCard}
      />

      <UltimateTakeover
        active={uiOverlay === 'ultimate' && !!currentRes}
        data={{
          heroId:       activeSnapshot.hero,
          ultimateName: currentRes?.scene.kind === 'ability' ? currentRes.scene.data.abilityName : '',
          tierLabel:    'T4 · Ultimate',
          bark:         'For the pack.',
          damage:       currentRes?.scene.kind === 'ability' ? (currentRes.scene.data.damage ?? 0) : 0,
        }}
      />

      <ActivityLog />
      <TooltipRenderer />
      <ToastQueue />
    </ScreenBands>
  )
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function cardPlayableState(
  _state: GameState,
  self: HeroSnapshot,
  card: HeroSnapshot['hand'][0],
  isViewerTurn: boolean,
  overlay: string,
): 'playable' | 'unaffordable' | 'wrong-timing-modal' | 'wrong-timing-opp' | 'resolution-active' {
  const affordable = self.cp >= card.cost
  if (!affordable) return 'unaffordable'
  if (overlay !== 'none' && overlay !== 'tooltip' && overlay !== 'card') return 'wrong-timing-modal'
  if (!isViewerTurn && card.kind !== 'instant') return 'wrong-timing-opp'
  return 'playable'
}

function comboSymbolList(combo: any): string[] {
  if (combo.kind === 'symbol-count' || combo.kind === 'matching' || combo.kind === 'at-least') {
    return Array(combo.count).fill(combo.symbol)
  }
  if (combo.kind === 'compound') {
    return combo.clauses.flatMap((c: any) => comboSymbolList(c))
  }
  return []
}

function comboOutlinedPips(combo: any): ('outlined' | 'gold' | 'pulse')[] {
  return comboSymbolList(combo).map(() => 'outlined')
}

// ---------------------------------------------------------------------------
// no-match placeholder
// ---------------------------------------------------------------------------

function NoMatch({ onGoHome }: { onGoHome: () => void }): JSX.Element {
  return (
    <div className={s.noMatch}>
      <div className={s.noMatchTitle}>No active match</div>
      <button className={s.noMatchButton} onClick={onGoHome}>Return home</button>
    </div>
  )
}

export default MatchScreen
