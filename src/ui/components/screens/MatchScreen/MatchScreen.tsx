/**
 * <MatchScreen>
 *
 * The rebuilt live match screen. Wires every band + ladder + FOP +
 * overlays against gameStore and uiStore. Dispatches engine actions
 * on user input via the action selectors.
 *
 * All hooks run unconditionally BEFORE the no-match early return —
 * conditional hooks crash React the moment `state` flips null ↔ set
 * while mounted (rematch / resume flows).
 *
 * Bible references: Parts 2, 3, 5, 6, 7.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameState, HeroId, HeroSnapshot, PlayerId } from '@/game/types'
import { useGameStore } from '@/store/gameStore'
import { useUIStore, wireResolutionBridge } from '@/ui/store/uiStore'
import { useResolutionDriver } from '@/ui/hooks/useResolutionDriver'
import { useAiDriver } from '@/ui/hooks/useAiDriver'
import { useAudioDriver } from '@/ui/hooks/useAudioDriver'
import { useJuice, useJuiceStore } from '@/ui/hooks/useJuice'
import { ScreenShake } from '@/ui/components/shared/ScreenShake'
import { TurnBanner } from '@/ui/components/shared/TurnBanner'
import { DamageFloaters } from '@/ui/components/shared/DamageFloaters'
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
import type { SpendYield } from '@/ui/components/overlays/SpendOverlay'
import { ExpandedAbilityView } from '@/ui/components/overlays/ExpandedAbilityView'
import { ExpandedCardView } from '@/ui/components/overlays/ExpandedCardView'
import { TooltipRenderer } from '@/ui/components/overlays/TooltipRenderer'
import { ToastQueue, toast } from '@/ui/components/overlays/ToastQueue'
import { ActivityLog } from '@/ui/components/overlays/ActivityLog'
import { CardPlayOverlay } from '@/ui/components/overlays/CardPlayOverlay'
import { OffensivePickPrompt } from '@/ui/components/overlays/OffensivePickPrompt'
import { InstantPrompt } from '@/ui/components/overlays/InstantPrompt'
import { MatchIntro } from '@/ui/components/screens/MatchIntro'
import { getHero } from '@/content'
import { canPlay } from '@/game/cards'
import { derivePhaseDisplay } from '@/ui/selectors/phaseDisplay'
import { deriveLadder } from '@/ui/selectors/ladder'
import { deriveStatusTrack } from '@/ui/selectors/statusTrack'
import { deriveActionBar } from '@/ui/selectors/actionBar'
import { withRollingFlag, type UiDie } from '@/ui/selectors/derivePips'
import s from './MatchScreen.module.css'

const ULT_BARKS: Record<HeroId, string> = {
  berserker:   'For the pack.',
  pyromancer:  'The mountain remembers.',
  lightbearer: 'Dawn breaks always.',
}

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

  // The preference is scoped to the commit it was made for — if it survives
  // past the turn (picker never fired), it would silently auto-pick a stale
  // ability on some FUTURE turn's picker.
  const currentTurn = state?.turn
  useEffect(() => {
    preferredAbilityIdx.current = null
  }, [currentTurn])

  // Two-tap Skip Turn protection — first tap arms, second tap (within the
  // window) executes the full pass. The arm auto-expires.
  const [skipArmed, setSkipArmed] = useState(false)
  useEffect(() => {
    if (!skipArmed) return
    const t = window.setTimeout(() => setSkipArmed(false), 3000)
    return () => window.clearTimeout(t)
  }, [skipArmed])

  // Bank-spend amount for the SpendOverlay stepper.
  const [spendAmount, setSpendAmount] = useState(0)

  // Subscribe to gameStore matchLog for dice-rolled events → trigger tumble.
  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      const log = s.matchLog
      if (log.length < lastDiceEventIdx.current) lastDiceEventIdx.current = 0
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
      if (log.length < lastCardEventIdx.current) lastCardEventIdx.current = 0
      if (log.length <= lastCardEventIdx.current) return
      for (let i = lastCardEventIdx.current; i < log.length; i++) {
        const ev = log[i]
        if (ev?.t === 'card-played') {
          const caster = s.state?.players[ev.player]
          if (!caster) continue
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

  // Redirect to summary when match ends — after the last cinematic drains
  // so lethal hits land on screen before the cut.
  const resolutionsIdle = !currentRes
  useEffect(() => {
    if (state?.phase === 'match-end' && resolutionsIdle) {
      const t = window.setTimeout(() => navigate('/summary'), 600)
      return () => window.clearTimeout(t)
    }
  }, [state?.phase, resolutionsIdle, navigate])

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

  // Offensive pick auto-answer: the player's remembered Activate choice
  // wins; otherwise a single eligible match commits itself (the Fire tap
  // was the commitment — a one-option picker is dead weight).
  useEffect(() => {
    const poc = state?.pendingOffensiveChoice
    if (!poc || poc.attacker !== viewerId) return
    const pref = preferredAbilityIdx.current
    if (pref != null) {
      preferredAbilityIdx.current = null
      const chosen = poc.matches.find(m => m.abilityIndex === pref)
      if (chosen) {
        dispatch({ kind: 'select-offensive-ability', abilityIndex: chosen.abilityIndex })
        return
      }
      // Preferred choice didn't survive engine eligibility — fall through.
    }
    if (poc.matches.length === 1) {
      dispatch({ kind: 'select-offensive-ability', abilityIndex: poc.matches[0]!.abilityIndex })
    }
  }, [state?.pendingOffensiveChoice, viewerId, dispatch])

  // When a bank-spend prompt opens for the viewer, default the stepper to
  // "spend everything" — one tap commits the pile, steppable down.
  const viewerBankSpend = state?.pendingBankSpend?.holder === viewerId ? state.pendingBankSpend : null
  useEffect(() => {
    if (viewerBankSpend) setSpendAmount(viewerBankSpend.available)
  }, [viewerBankSpend?.holder, viewerBankSpend?.context, viewerBankSpend?.available])

  // Instant window: only cards whose trigger actually answers the pending
  // status-removal qualify — offering unrelated Instants would burn the
  // prompt without preventing anything.
  const pendingRemoval = state?.pendingStatusRemoval
  const viewerHand = state?.players[viewerId]?.hand
  const viewerCp = state?.players[viewerId]?.cp ?? 0
  const instantCandidates = useMemo(() => {
    if (!pendingRemoval || pendingRemoval.holder !== viewerId || !viewerHand) return []
    return viewerHand.filter(c =>
      c.kind === 'instant'
      && c.trigger.kind === 'opponent-attempts-remove-status'
      && c.trigger.status === pendingRemoval.status
      && viewerCp >= c.cost,
    )
  }, [pendingRemoval, viewerHand, viewerCp, viewerId])

  // Safety valve: if the engine is waiting on the viewer's instant window
  // but no playable candidate exists (CP drained since the prompt opened,
  // resumed save, etc.), auto-decline rather than deadlock the match.
  useEffect(() => {
    if (!pendingRemoval || pendingRemoval.holder !== viewerId) return
    if (instantCandidates.length === 0) {
      dispatch({ kind: 'respond-to-status-removal', cardId: null })
    }
  }, [pendingRemoval, instantCandidates.length, viewerId, dispatch])

  // Derived overlay props ------------------------------------------------

  const defensiveOptions = useMemo(() => {
    if (!state?.pendingAttack || state.pendingAttack.defender !== viewerId) return []
    const self = state.players[viewerId]
    return self.activeDefense.map((d) => ({
      id:         d.name,
      name:       d.name,
      effectText: d.shortText,
      descriptor: { kind: 'sigil' as const, symbols: comboSymbolList(d.combo) },
      comboState: { status: 'ineligible' as const, pips: comboOutlinedPips(d.combo) },
      diceCount:  d.defenseDiceCount ?? 3,
    }))
  }, [state?.pendingAttack, state?.players, viewerId])

  const spendYields = useMemo<SpendYield[]>(() => {
    if (!viewerBankSpend || !state) return []
    const heroDef = getHero(state.players[viewerId].hero)
    const opts = (heroDef.signatureMechanic.implementation.spendOptions ?? [])
      .filter(o => o.context === viewerBankSpend.context)
    return opts.map((o, i) => {
      const eff = o.effect as { kind: string; perUnit?: number }
      const per = eff.perUnit ?? 0
      const total = per * spendAmount
      switch (eff.kind) {
        case 'damage-bonus':    return { id: `y${i}`, value: `+${total}`, label: 'Bonus damage on this attack' }
        case 'heal-self':       return { id: `y${i}`, value: `+${total}`, label: 'HP restored' }
        case 'reduce-incoming': return { id: `y${i}`, value: `−${total}`, label: 'Incoming damage prevented' }
        default:                return { id: `y${i}`, value: `${total}`, label: eff.kind }
      }
    })
  }, [viewerBankSpend, state, viewerId, spendAmount])

  // ── No-match early return (all hooks above this line) ─────────────────

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
  const resolutionActive = uiOverlay === 'ultimate' || currentRes != null
  const actionBar = deriveActionBar({
    state,
    viewerId,
    activeOverlay: uiOverlay,
    resolutionActive,
    selectedDefenseId,
    skipArmed,
  })

  const selectedAbility = ladder.find(a => a.id === selectedAbilityId) ?? null
  const focusedCard = self.hand.find(c => c.id === focusedCardId) ?? null

  // The Play button must agree with the engine — an enabled button whose
  // dispatch the engine rejects is a dead tap. `canPlay` is the truth;
  // the reason string explains WHY it's blocked.
  const focusedCardPlayable =
    focusedCard != null
    && (isViewerTurn || focusedCard.kind === 'instant')
    && canPlay(state, self, opponent, focusedCard)
  const focusedCardBlockReason = ((): string | undefined => {
    if (!focusedCard || focusedCardPlayable) return undefined
    if (self.cp < focusedCard.cost) return `NEED ${focusedCard.cost} CP (HAVE ${self.cp})`
    if (!isViewerTurn && focusedCard.kind !== 'instant') return 'NOT YOUR TURN'
    if (focusedCard.oncePerMatch && self.consumedOncePerMatchCards.includes(focusedCard.id)) return 'ALREADY USED THIS MATCH'
    if (focusedCard.oncePerTurn && self.consumedOncePerTurnCards.includes(focusedCard.id)) return 'ALREADY USED THIS TURN'
    const k = focusedCard.kind
    const mainish = k === 'main-phase' || k === 'main-action' || k === 'upgrade' || k === 'status' || k === 'mastery'
    if (mainish && state.phase !== 'main-pre' && state.phase !== 'main-post') return 'MAIN PHASE ONLY'
    if ((k === 'roll-phase' || k === 'roll-action') && state.phase !== 'offensive-roll' && state.phase !== 'defensive-roll') return 'ROLL PHASE ONLY'
    if (k === 'mastery') return 'MASTERY SLOT FILLED'
    return 'CANNOT PLAY RIGHT NOW'
  })()

  const viewerHasRolled =
    self.rollAttemptsRemaining < 3 || self.forcedFaceValue != null

  const pendingAttackOnViewer = state.pendingAttack?.defender === viewerId ? state.pendingAttack : null
  const attackDefendable = pendingAttackOnViewer
    ? pendingAttackOnViewer.damageType === 'normal' || pendingAttackOnViewer.damageType === 'collateral'
    : true

  // Handlers -------------------------------------------------------------

  const canRoll = isViewerTurn && (state.phase === 'main-pre' || state.phase === 'offensive-roll')

  const onDieTap = (index: number) => {
    if (!canRoll) return
    dispatch({ kind: 'toggle-die-lock', die: index as 0|1|2|3|4 })
  }

  const executeFullSkip = () => {
    // Full pass: fizzle past the roll phase (engine's never-rolled guard
    // keeps resting dice from firing anything) and end the turn.
    setSkipArmed(false)
    if (state.phase === 'main-pre') {
      dispatch({ kind: 'advance-phase' })   // → offensive-roll
      dispatch({ kind: 'advance-phase' })   // → fizzle → main-post
      dispatch({ kind: 'end-turn' })
    } else if (state.phase === 'main-post') {
      dispatch({ kind: 'end-turn' })
    }
  }

  const onActionTap = (id: string) => {
    if (id !== 'skip-turn') setSkipArmed(false)
    switch (id) {
      case 'roll':
        return dispatch({ kind: 'roll-dice' })
      case 'commit':
        // End rolling; engine's beginOffensivePick decides. Auto-commits
        // if one match, fizzles if none, opens picker if multiple.
        return dispatch({ kind: 'advance-phase' })
      case 'end-turn':
        return dispatch({ kind: 'end-turn' })
      case 'skip-turn':
        if (state.phase === 'main-post') {
          return dispatch({ kind: 'end-turn' })
        }
        if (state.phase !== 'main-pre') return
        if (!skipArmed) { setSkipArmed(true); return }
        return executeFullSkip()
      case 'take-hit':
        if (state.pendingAttack) {
          dispatch({ kind: 'select-defense', abilityIndex: null })
          selectDefense(null)
        }
        return
      case 'confirm-defense':
        if (state.pendingAttack) {
          if (!attackDefendable) {
            dispatch({ kind: 'select-defense', abilityIndex: null })
            selectDefense(null)
            return
          }
          const idx = self.activeDefense.findIndex(a => a.name === selectedDefenseId)
          if (idx < 0) return   // nothing picked — bar shows disabled state
          dispatch({ kind: 'select-defense', abilityIndex: idx })
          selectDefense(null)
        }
        return
      case 'confirm-spend':
        if (state.pendingBankSpend) {
          if (spendAmount <= 0) dispatch({ kind: 'decline-bank-spend' })
          else dispatch({ kind: 'spend-bank', amount: spendAmount })
        }
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
    dispatch({ kind: 'advance-phase' })
  }

  const onPlayCard = () => {
    if (!focusedCard) return
    setOverlay('none')
    focusCard(null)
    dispatch({ kind: 'play-card', card: focusedCard.id, casterPlayer: viewerId })
  }

  const cardSellable =
    isViewerTurn
    && (state.phase === 'main-pre' || state.phase === 'main-post')
    && !state.pendingOffensiveChoice

  const onSellCard = () => {
    if (!focusedCard) return
    setOverlay('none')
    focusCard(null)
    dispatch({ kind: 'sell-card', card: focusedCard.id })
    toast('info', `Sold ${focusedCard.name} · +1 CP`)
  }

  const onOffensivePick = (abilityIndex: number) => {
    dispatch({ kind: 'select-offensive-ability', abilityIndex })
  }
  const onOffensiveDecline = () => {
    dispatch({ kind: 'select-offensive-ability', abilityIndex: null })
  }

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
          {self.hand.length === 0 ? (
            <div className={s.emptyHand}>No cards in hand</div>
          ) : self.hand.map((card, idx) => (
            <HandCard
              key={card.id + '-' + idx}
              card={card}
              position={idx}
              state={cardPlayableState(state, self, opponent, card, isViewerTurn, uiOverlay)}
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
        active={uiOverlay !== 'ability' && !!pendingAttackOnViewer}
        incoming={{
          damage:      state.pendingAttack?.incomingAmount ?? 0,
          sourceLabel: `${state.pendingAttack?.abilityName ?? ''} · T${state.pendingAttack?.tier ?? ''}`,
        }}
        options={defensiveOptions}
        selectedId={selectedDefenseId}
        onSelect={selectDefense}
        undefendable={!attackDefendable}
      />

      <SpendOverlay
        active={!!viewerBankSpend}
        resourceName="Radiance"
        available={viewerBankSpend?.available ?? 0}
        max={6}
        amount={spendAmount}
        yields={spendYields}
        contextLabel={
          viewerBankSpend?.context === 'offensive-resolution'
            ? 'Empower the attack you are about to land'
            : 'Blunt the attack coming at you'
        }
        onAmountChange={setSpendAmount}
      />

      <ExpandedAbilityView
        active={uiOverlay === 'ability' && !!selectedAbility}
        ability={selectedAbility}
        activatable={
          isViewerTurn
          && viewerHasRolled
          && selectedAbility?.comboState.status === 'eligible'
          && state.phase === 'offensive-roll'
        }
        readOnly={!isViewerTurn}
        unactivatableReason={
          !isViewerTurn ? 'NOT YOUR TURN'
          : !viewerHasRolled ? 'ROLL FIRST'
          : selectedAbility?.comboState.status !== 'eligible' ? 'COMBO NOT MET'
          : state.phase !== 'offensive-roll' ? 'NOT ROLL PHASE'
          : undefined
        }
        onCancel={onCancelOverlay}
        onActivate={onActivateAbility}
      />

      <ExpandedCardView
        active={uiOverlay === 'card' && !!focusedCard}
        card={focusedCard}
        affordable={focusedCard != null && self.cp >= focusedCard.cost}
        playable={focusedCardPlayable}
        unplayableReason={focusedCardBlockReason}
        sellable={cardSellable}
        onCancel={onCancelOverlay}
        onPlay={onPlayCard}
        onSell={onSellCard}
      />

      <UltimateTakeover
        active={uiOverlay === 'ultimate' && !!currentRes}
        data={{
          heroId:       activeSnapshot.hero,
          ultimateName: currentRes?.scene.kind === 'ability' ? currentRes.scene.data.abilityName : '',
          tierLabel:    'T4 · Ultimate',
          bark:         ULT_BARKS[activeSnapshot.hero] ?? 'The pact holds.',
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
        active={
          !!state.pendingOffensiveChoice
          && state.pendingOffensiveChoice.attacker === viewerId
          && state.pendingOffensiveChoice.matches.length > 1
        }
        matches={state.pendingOffensiveChoice?.matches ?? []}
        onSelect={onOffensivePick}
        onDecline={onOffensiveDecline}
      />

      <InstantPrompt
        active={!!pendingRemoval && pendingRemoval.holder === viewerId && instantCandidates.length > 0}
        title={pendingRemoval ? `Prevent ${pendingRemoval.status} removal?` : ''}
        subtitle={pendingRemoval ? `${pendingRemoval.stacks} stacks would be removed` : undefined}
        candidates={instantCandidates}
        onPlay={onInstantPlay}
        onDecline={onInstantDecline}
      />

      <ActivityLog />
      <TurnBanner />
      <DamageFloaters />
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
  opponent: HeroSnapshot,
  card: HeroSnapshot['hand'][0],
  isViewerTurn: boolean,
  overlay: string,
): 'playable' | 'unaffordable' | 'wrong-timing-modal' | 'wrong-timing-opp' | 'resolution-active' {
  const affordable = self.cp >= card.cost
  if (!affordable) return 'unaffordable'
  if (overlay !== 'none' && overlay !== 'tooltip' && overlay !== 'card') return 'wrong-timing-modal'
  if (!isViewerTurn && card.kind !== 'instant') return 'wrong-timing-opp'
  // The engine's canPlay is the single source of truth (phase gates,
  // playCondition, once-per-match/turn, mastery slots) — a bright card
  // whose Play the engine rejects is a dead tap.
  if (!canPlay(state, self, opponent, card)) return 'wrong-timing-modal'
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
