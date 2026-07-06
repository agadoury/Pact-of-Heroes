/**
 * <MatchScreen>
 *
 * The rebuilt live match screen. Wires every band + ladder + FOP +
 * overlays against gameStore and uiStore. Dispatches engine actions
 * on user input via the action selectors.
 *
 * Bible references: Parts 2, 3, 5, 6, 7.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameState, HeroSnapshot, PlayerId } from '@/game/types'
import { useGameStore } from '@/store/gameStore'
import { useUIStore, wireResolutionBridge } from '@/ui/store/uiStore'
import { useResolutionDriver } from '@/ui/hooks/useResolutionDriver'
import { useAiDriver } from '@/ui/hooks/useAiDriver'
import { useAudioDriver } from '@/ui/hooks/useAudioDriver'
import { useJuice, useJuiceStore } from '@/ui/hooks/useJuice'
import { ScreenShake } from '@/ui/components/shared/ScreenShake'
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
import { CardPlayOverlay } from '@/ui/components/overlays/CardPlayOverlay'
import { OffensivePickPrompt } from '@/ui/components/overlays/OffensivePickPrompt'
import { InstantPrompt } from '@/ui/components/overlays/InstantPrompt'
import { MatchIntro } from '@/ui/components/screens/MatchIntro'
import { useState } from 'react'
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

  // Card-play cinematic — MatchScreen watches gameStore.matchLog for
  // card-played events (both viewer's and opponent's) and pops the
  // CardPlayOverlay accordingly.
  const [playedCard, setPlayedCard] = useState<import('@/game/types').Card | null>(null)
  const [playedByOpp, setPlayedByOpp] = useState(false)
  const lastCardEventIdx = useRef(0)

  // Dice tumble — clock a short "isRolling" burst whenever roll-dice fires.
  const [rollingUntil, setRollingUntil] = useState(0)
  const isRolling = performance.now() < rollingUntil
  const lastDiceEventIdx = useRef(0)

  // Match-intro cinematic — plays once per match on first mount with state.
  const introShownFor = useRef<string | null>(null)
  const [introActive, setIntroActive] = useState(false)

  // When the player taps Activate on a specific ability, remember which one.
  // If the ensuing advance-phase triggers a multi-ability picker, we auto-pick
  // this one so the player's chosen ability wins without a second modal.
  const preferredAbilityIdx = useRef<number | null>(null)

  // Subscribe to gameStore matchLog for dice-rolled events → trigger tumble.
  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length <= lastDiceEventIdx.current) return
      for (let i = lastDiceEventIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (ev?.t === 'dice-rolled') {
          setRollingUntil(performance.now() + 600)
        }
      }
      lastDiceEventIdx.current = log.length
    })
    return unsub
  }, [])

  // Tick to force isRolling to update after the timeout expires.
  useEffect(() => {
    if (rollingUntil === 0) return
    const remaining = rollingUntil - performance.now()
    if (remaining <= 0) return
    const t = window.setTimeout(() => setRollingUntil(0), remaining + 50)
    return () => window.clearTimeout(t)
  }, [rollingUntil])

  // Subscribe to gameStore matchLog to pop CardPlayOverlay on the latest
  // card-played event (viewer or opponent). Look up the card object via
  // the caster's catalog.
  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length <= lastCardEventIdx.current) return
      for (let i = lastCardEventIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (ev?.t === 'card-played') {
          const caster = s.state?.players[ev.player]
          if (!caster) continue
          // Look for the card in the caster's hand + deck + discard (already
          // moved). Fall back to a placeholder if unknown — the overlay's
          // effect-parser will still render something readable.
          const found =
            caster.hand.find(c => c.id === ev.cardId)
            ?? caster.deck.find(c => c.id === ev.cardId)
            ?? caster.discard.find(c => c.id === ev.cardId)
          if (found) {
            setPlayedCard(found)
            setPlayedByOpp(ev.player !== viewerId)
          }
        }
      }
      lastCardEventIdx.current = log.length
    })
    return unsub
  }, [viewerId])

  // Wire event bridge once.
  useEffect(() => {
    const unsub = wireResolutionBridge()
    return unsub
  }, [])

  // Drive queued resolutions.
  useResolutionDriver()

  // Drive the AI opponent (p2 in single-player vs AI mode).
  const aiPlayer = useGameStore(g => g.aiPlayer)
  useAiDriver(aiPlayer)

  // Audio + juice (screen shake, hit flash).
  useAudioDriver()
  useJuice()

  // Read hit-flash target so strips flash when they take damage.
  const hitFlashPlayer = useJuiceStore(j => j.hitFlashPlayer)
  const hitFlashAt     = useJuiceStore(j => j.hitFlashAt)

  // Redirect to summary when match ends.
  useEffect(() => {
    if (state?.phase === 'match-end') {
      navigate('/summary')
    }
  }, [state?.phase, navigate])

  // Play the intro cinematic once per fresh match.
  useEffect(() => {
    if (!state) return
    const key = `${state.players.p1.hero}-vs-${state.players.p2.hero}-t${state.turn}`
    if (introShownFor.current === key) return
    if (state.turn === 1 && state.phase !== 'match-end') {
      introShownFor.current = key
      setIntroActive(true)
    }
  }, [state?.players.p1.hero, state?.players.p2.hero, state?.turn, state?.phase, state])

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

  const canRoll = isViewerTurn && (state.phase === 'main-pre' || state.phase === 'offensive-roll')

  const onDieTap = (index: number) => {
    if (!canRoll) return
    // Only unlocked dice from the current roll can be locked; can't toggle
    // during the tumble animation. Engine rejects invalid inputs anyway.
    dispatch({ kind: 'toggle-die-lock', die: index as 0|1|2|3|4 })
  }

  const onActionTap = (id: string) => {
    switch (id) {
      case 'roll':
        // roll-dice from main-pre auto-enters offensive-roll and consumes
        // one attempt. From offensive-roll it consumes another attempt.
        return dispatch({ kind: 'roll-dice' })
      case 'commit':
        // End rolling; engine's beginOffensivePick decides. Auto-commits
        // if one match, fizzles if none, opens picker if multiple.
        return dispatch({ kind: 'advance-phase' })
      case 'end-turn':
        return dispatch({ kind: 'end-turn' })
      case 'skip-turn':
        // Skip during main-pre / offensive-roll = fizzle + advance to
        // main-post. During main-post it's an end-turn.
        if (state.phase === 'main-post') {
          return dispatch({ kind: 'end-turn' })
        }
        // From other viewer phases: advance-phase walks to main-post,
        // then a follow-up end-turn dispatch would be needed. Simpler:
        // just advance-phase; player can hit End Turn from main-post.
        return dispatch({ kind: 'advance-phase' })
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
    // Remember the choice for auto-selection if the picker fires.
    preferredAbilityIdx.current = idx
    // Advance the phase — engine will either auto-commit this ability
    // (if it's the only eligible one) or emit pendingOffensiveChoice
    // (which our useEffect below auto-answers with preferredAbilityIdx).
    dispatch({ kind: 'advance-phase' })
  }

  // If pendingOffensiveChoice fires AND we remembered a preferred ability,
  // auto-select it so the player doesn't see a redundant picker.
  useEffect(() => {
    if (!state?.pendingOffensiveChoice) return
    if (state.pendingOffensiveChoice.attacker !== viewerId) return
    const pref = preferredAbilityIdx.current
    if (pref == null) return
    const matches = state.pendingOffensiveChoice.matches
    const chosen = matches.find(m => m.abilityIndex === pref)
    if (chosen) {
      preferredAbilityIdx.current = null
      dispatch({ kind: 'select-offensive-ability', abilityIndex: chosen.abilityIndex })
    } else {
      // Preferred choice didn't survive engine eligibility — clear and
      // let the manual picker overlay handle it.
      preferredAbilityIdx.current = null
    }
  }, [state?.pendingOffensiveChoice, viewerId, dispatch])

  const onPlayCard = () => {
    if (!focusedCard) return
    setOverlay('none')
    focusCard(null)
    // Card overlay pops from the matchLog subscription — we don't
    // pre-render it here to avoid double-firing.
    dispatch({ kind: 'play-card', card: focusedCard.id, casterPlayer: viewerId })
  }

  const onOffensivePick = (abilityIndex: number) => {
    dispatch({ kind: 'select-offensive-ability', abilityIndex })
  }
  const onOffensiveDecline = () => {
    dispatch({ kind: 'select-offensive-ability', abilityIndex: null })
  }

  const instantCandidates = useMemo(() =>
    self.hand.filter(c => c.kind === 'instant'),
    [self.hand],
  )

  const onInstantPlay = (cardId: string) => {
    dispatch({ kind: 'respond-to-status-removal', cardId: cardId })
  }
  const onInstantDecline = () => {
    dispatch({ kind: 'respond-to-status-removal', cardId: null })
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

  const opponentFlashActive = hitFlashPlayer === opponentId && performance.now() - hitFlashAt < 500
  const selfFlashActive     = hitFlashPlayer === viewerId    && performance.now() - hitFlashAt < 500

  return (
    <ScreenShake>
    <ScreenBands>
      <div className={s.band} data-band="opp-strip">
        <HeroStrip
          playerId={opponentId}
          viewerId={viewerId}
          snapshot={opponent}
          recentDamageTaken={opponentFlashActive ? 1 : null}
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
          isRolling={isRolling}
          interactable={canRoll && !isRolling}
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
          recentDamageTaken={selfFlashActive ? 1 : null}
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
        activatable={
          isViewerTurn
          && selectedAbility?.comboState.status === 'eligible'
          && (state.phase === 'main-pre' || state.phase === 'offensive-roll')
        }
        readOnly={!isViewerTurn}
        unactivatableReason={
          !isViewerTurn ? 'NOT YOUR TURN'
          : selectedAbility?.comboState.status !== 'eligible' ? 'COMBO NOT MET'
          : (state.phase !== 'main-pre' && state.phase !== 'offensive-roll') ? 'NOT ROLL PHASE'
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

      <MatchIntro
        active={introActive}
        playerHero={state.players[viewerId].hero}
        opponentHero={state.players[viewerId === 'p1' ? 'p2' : 'p1'].hero}
        onComplete={() => setIntroActive(false)}
      />

      <CardPlayOverlay
        active={!!playedCard}
        card={playedCard}
        tone={playedByOpp ? 'ember' : 'gold'}
        onComplete={() => setPlayedCard(null)}
      />

      <OffensivePickPrompt
        active={!!state.pendingOffensiveChoice && state.pendingOffensiveChoice.attacker === viewerId}
        matches={state.pendingOffensiveChoice?.matches ?? []}
        onSelect={onOffensivePick}
        onDecline={onOffensiveDecline}
      />

      <InstantPrompt
        active={!!state.pendingStatusRemoval && state.pendingStatusRemoval.holder === viewerId && instantCandidates.length > 0}
        title={state.pendingStatusRemoval ? `Prevent ${state.pendingStatusRemoval.status} removal?` : ''}
        subtitle={state.pendingStatusRemoval ? `${state.pendingStatusRemoval.stacks} stacks would be removed` : undefined}
        candidates={instantCandidates}
        onPlay={onInstantPlay}
        onDecline={onInstantDecline}
      />

      <ActivityLog />
      <TooltipRenderer />
      <ToastQueue />
    </ScreenBands>
    </ScreenShake>
  )
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function cardPlayableState(
  state: GameState,
  self: HeroSnapshot,
  card: HeroSnapshot['hand'][0],
  isViewerTurn: boolean,
  overlay: string,
): 'playable' | 'unaffordable' | 'wrong-timing-modal' | 'wrong-timing-opp' | 'resolution-active' {
  const affordable = self.cp >= card.cost
  if (!affordable) return 'unaffordable'
  if (overlay !== 'none' && overlay !== 'tooltip' && overlay !== 'card') return 'wrong-timing-modal'
  if (!isViewerTurn && card.kind !== 'instant') return 'wrong-timing-opp'

  // Phase-gate by card kind — mirrors engine's canPlay() switch.
  const p = state.phase
  const mainPhase = p === 'main-pre' || p === 'main-post'
  const rollPhase = p === 'offensive-roll' || p === 'defensive-roll'

  switch (card.kind) {
    case 'main-action':
    case 'upgrade':
    case 'main-phase':
    case 'status':
      if (!mainPhase && isViewerTurn) return 'wrong-timing-modal'
      break
    case 'roll-action':
    case 'roll-phase':
      if (!rollPhase && isViewerTurn) return 'wrong-timing-modal'
      break
    case 'mastery':
      if (!mainPhase && isViewerTurn) return 'wrong-timing-modal'
      break
    case 'instant':
      // Always playable subject to CP + trigger — engine checks.
      break
  }
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
