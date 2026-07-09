/**
 * Pact of Heroes — heuristic AI (Medium for MVP).
 *
 * The AI consumes the same `evaluateLadder` the player UI uses, so it can
 * never have asymmetric information about reachability. Decisions are
 * greedy + a few heuristic weights — no tree search.
 *
 * Decision points the AI is asked to make per turn:
 *   - Main Phase (pre-roll):  which cards to play/sell.
 *   - Offensive Roll:         which dice to lock between attempts.
 *   - Main Phase (post-roll): which cards to play/sell.
 *   - End turn.
 *
 * Counter-prompt responses are decided by a simple "is this worth it" check.
 */

import type { Action, GameState, PlayerId, StatusId } from "./types";
import { ROLL_ATTEMPTS, HAND_CAP } from "./types";
import { getHero } from "../content";
import { evaluateLadder, pickKeepMask, symbolsOnDice, comboMatchesFaces } from "./dice";
import { stacksOf, getStatusDef } from "./status";
import { canPlay, resolveAbilityFor } from "./cards";

// ── Pact Ranks: AI difficulty profiles ──────────────────────────────────────
/** Named opponent rank the player queues into. */
export type AiRank = "squire" | "champion" | "nightmare";

/** The knobs that differentiate the three ranks. Champion is the baseline
 *  tuning the game shipped with; Squire defangs it, Nightmare sharpens it.
 *  Every number here was previously a hardcoded constant in this file. */
export interface AiProfile {
  id: AiRank;
  /** Commit as soon as a combo at this ladder row (0-based) is firing —
   *  lower = settles for weaker tiers instead of fishing for upgrades. */
  commitTier: number;
  /** Reach for defensive Instants when incoming damage ≥ this (a lethal
   *  hit always qualifies regardless). */
  instantThreatGate: number;
  /** Max signature-bank tokens spent per offensive attack. */
  offensiveSpendCap: number;
  /** Defensive bank spend leaves this much damage to the defense roll —
   *  lower = mitigates harder, spends its bank lethally. */
  defenseSpendSlack: number;
  /** CP cushion above cost required before playing unlisted hero cards. */
  unlistedCardCushion: number;
  /** Monte-Carlo samples for ladder reachability — more = sharper reads. */
  reachabilitySamples: number;
  /** Commit to a lethal line when its reach probability ≥ this — lower =
   *  smells blood earlier and goes for the kill. */
  lethalCommitProb: number;
  /** When already firing at the commit tier with attempts left, keep
   *  fishing for a HIGHER row reachable with ≥ this probability. The
   *  firing combo's dice are locked, so the fish is risk-free upside —
   *  null = never fish (commit immediately, the baseline behaviour). */
  fishHigherProb: number | null;
}

export const AI_PROFILES: Record<AiRank, AiProfile> = {
  squire: {
    id: "squire",
    commitTier: 0,          // takes the first combo it hits — never fishes
    instantThreatGate: 9,   // hoards its Instants until near-lethal
    offensiveSpendCap: 2,
    defenseSpendSlack: 5,
    unlistedCardCushion: 5, // plays fewer tech cards
    reachabilitySamples: 80,
    lethalCommitProb: 0.5,  // barely notices kill windows
    fishHigherProb: null,
  },
  champion: {
    id: "champion",
    commitTier: 2,
    instantThreatGate: 6,
    offensiveSpendCap: 4,
    defenseSpendSlack: 3,
    unlistedCardCushion: 3,
    reachabilitySamples: 200,
    lethalCommitProb: 0.3,
    fishHigherProb: null,
  },
  nightmare: {
    id: "nightmare",
    commitTier: 2,
    instantThreatGate: 4,   // reaches for answers on medium hits
    offensiveSpendCap: 6,   // dumps its bank into closes
    defenseSpendSlack: 2,   // mitigates harder (but keeps Judgment fuel)
    unlistedCardCushion: 2, // plays most of its deck
    reachabilitySamples: 400,
    lethalCommitProb: 0.15, // smells blood two rolls out
    fishHigherProb: 0.35,   // rerolls free dice at a reachable T3/T4
  },
};

/** Renown payout multiplier per rank — the stakes dial. */
export const RANK_RENOWN_MULT: Record<AiRank, number> = {
  squire: 1,
  champion: 1.5,
  nightmare: 2,
};

/** Nightmare's blood pact — a transparent material edge (start-state
 *  modifiers on the AI's seat) layered on its sharper play. The heuristic
 *  brain is near its behavioural ceiling (mirror sims put profile-only
 *  Nightmare ≈ Champion), so the rank's teeth come from here; the UI
 *  advertises it so it reads as a boss, not a cheat. */
export const NIGHTMARE_BLOOD_PACT = { hp: 3, cp: 1 } as const;

// ── Pending-prompt routing ───────────────────────────────────────────────────
/** Which player must act next? Pending prompts pre-empt the active player's
 *  normal phase flow — the engine is halted until the prompt's holder
 *  answers through its dedicated action. Drivers (UI + simulator) use this
 *  to ask the right brain for the next action instead of assuming the
 *  active player always moves. */
export function pendingActorFor(state: GameState): PlayerId {
  if (state.pendingBankSpend)      return state.pendingBankSpend.holder;
  if (state.pendingStatusRemoval)  return state.pendingStatusRemoval.holder;
  if (state.pendingCounter)        return state.pendingCounter.holder;
  if (state.pendingOffensiveChoice) return state.pendingOffensiveChoice.attacker;
  if (state.pendingAttack)         return state.pendingAttack.defender;
  return state.activePlayer;
}

// ── Top-level driver: returns the next action the AI wants to take. ─────────
/** Decide the AI's next action. Returns `null` when the AI has nothing to
 *  do right now (not its turn and no prompt targets it) — callers must not
 *  dispatch in that case. */
export function nextAiAction(
  state: GameState,
  ai: PlayerId,
  profile: AiProfile = AI_PROFILES.champion,
): Action | null {
  // §Lightbearer: bankable spend prompt. Offensive-resolution: spend
  // generously when the attack is likely to land (we already committed
  // to firing) — every token banks +2 dmg / +1 heal. Defensive: spend
  // enough to fully mitigate the incoming damage when affordable;
  // otherwise spend whatever fits. This is intentionally aggressive —
  // the bankable resource is meant to be used.
  if (state.pendingBankSpend && state.pendingBankSpend.holder === ai) {
    const pbs = state.pendingBankSpend;
    if (pbs.context === "offensive-resolution") {
      // Cap the burst per attack, leaving some bank for the next turn —
      // Nightmare's higher cap dumps the bank into closes.
      const want = Math.min(pbs.available, profile.offensiveSpendCap);
      return { kind: "spend-bank", amount: want };
    }
    if (pbs.context === "defensive-resolution") {
      // Leave room for the defense roll we're about to make (profile
      // slack ≈ its typical reduction) and never spend into chip damage —
      // the bank feeds Judgment of the Sun.
      const incoming = state.pendingAttack?.incomingAmount ?? 0;
      const want = Math.min(pbs.available, Math.max(0, incoming - profile.defenseSpendSlack));
      return want > 0 ? { kind: "spend-bank", amount: want } : { kind: "decline-bank-spend" };
    }
    return { kind: "decline-bank-spend" };
  }
  // §Instant window: the opponent is trying to strip a status off us.
  // Play a matching preventive Instant when we hold one and the stacks are
  // worth protecting; otherwise let the removal complete.
  if (state.pendingStatusRemoval && state.pendingStatusRemoval.holder === ai) {
    const psr = state.pendingStatusRemoval;
    const me = state.players[ai];
    const preventive = me.hand.find(c =>
      c.kind === "instant"
      && c.trigger.kind === "opponent-attempts-remove-status"
      && c.trigger.status === psr.status
      && me.cp >= c.cost,
    );
    if (preventive && psr.stacks >= 2) {
      return { kind: "respond-to-status-removal", cardId: preventive.id };
    }
    return { kind: "respond-to-status-removal", cardId: null };
  }
  // Counter-prompt — can target the off-turn holder at any point.
  if (state.pendingCounter && state.pendingCounter.holder === ai) {
    return { kind: "respond-to-counter", accept: shouldAcceptCounter(state, ai) };
  }
  // On-turn: respond to the offensive picker prompt before anything else.
  if (state.pendingOffensiveChoice && state.pendingOffensiveChoice.attacker === ai) {
    // Pick the highest-tier highest-damage match (the matches array is
    // already sorted that way). Mirrors the legacy auto-pick behaviour.
    const top = state.pendingOffensiveChoice.matches[0];
    return { kind: "select-offensive-ability", abilityIndex: top?.abilityIndex ?? null };
  }
  // Off-turn: AI may need to respond to a pendingAttack against itself.
  if (state.pendingAttack && state.pendingAttack.defender === ai) {
    // Instant window — fire a matching Instant (Aegis of Dawn,
    // Phoenix Veil, etc.) BEFORE committing to a defense pick. The
    // engine resolves the instant's effect immediately (e.g. Aegis
    // queues a multiplier reduce-damage onto pa.injectedReduction);
    // pendingAttack stays set so we re-enter this branch and can
    // either play another instant or finalise with select-defense.
    const me = state.players[ai];
    const opponent = state.players[other(ai)];
    const pa0 = state.pendingAttack;
    // Only reach for an Instant when the hit is heavy or would kill us —
    // burning a once-per-match negate on 3 chip damage reads as broken.
    const threat = pa0.incomingAmount >= profile.instantThreatGate || me.hp <= pa0.incomingAmount;
    const instant = threat
      ? me.hand.find(c => c.kind === "instant" && instantMatchesPendingAttack(c, state) && canPlay(state, me, opponent, c))
      : undefined;
    if (instant) return { kind: "play-card", card: instant.id, casterPlayer: ai };

    // No instant to play — pick a defense. For non-defendable attacks
    // (undefendable / pure / ultimate) the defender cannot roll a
    // defense, so we resolve with abilityIndex: null and let any
    // injected reduction (from instants) carry through.
    const pa = state.pendingAttack;
    const defendable = pa.damageType === "normal" || pa.damageType === "collateral";
    const idx = defendable ? pickBestDefense(state, ai) : null;
    return { kind: "select-defense", abilityIndex: idx };
  }
  if (state.activePlayer !== ai) {
    // Not our turn and no prompt targets us — nothing to do. Returning an
    // action here (the old advance-phase fallthrough) would mutate the
    // opponent's turn flow mid-thought.
    return null;
  }
  // A pending prompt held by the opponent (their defense pick against our
  // attack, their instant window) freezes our own flow — wait for them.
  if (pendingActorFor(state) !== ai) return null;
  switch (state.phase) {
    case "pre-match":      return { kind: "advance-phase" };
    case "upkeep":
    case "income":         return { kind: "advance-phase" };
    case "main-pre":       return decideMainPre(state, ai, profile);
    case "offensive-roll": return decideOffensiveRoll(state, ai, profile);
    case "defensive-roll": return { kind: "advance-phase" };
    case "main-post":      return decideMainPost(state, ai);
    case "discard":        return { kind: "advance-phase" };
    case "match-end":      return null;
  }
}

/** Pick the highest-tier defense available — same intuition as the old
 *  auto-resolver's picker. Returns null if the defender has no ladder. */
/** Decide whether a card's structured Instant trigger qualifies for the
 *  current `pendingAttack`. Currently handles `self-attacked` (any incoming
 *  attack) and `opponent-fires-ability` (matched on tier). Other trigger
 *  shapes are best-effort no-ops here — they'd fire on different events
 *  the AI doesn't currently inspect. */
function instantMatchesPendingAttack(card: import("./types").Card, state: GameState): boolean {
  const pa = state.pendingAttack;
  if (!pa) return false;
  const trig = card.trigger;
  if (trig.kind === "self-attacked" || trig.kind === "self-takes-damage") {
    const tier = trig.kind === "self-attacked" ? trig.tier : undefined;
    return tier == null || tier === "any" || tier === pa.tier;
  }
  if (trig.kind === "opponent-fires-ability") {
    return trig.tier == null || trig.tier === "any" || trig.tier === pa.tier;
  }
  return false;
}

/** First face-symbol-bend leaf in the effect tree, if any. */
function findSymbolBend(effect: import("./types").AbilityEffect): { from: string; to: string } | null {
  if (effect.kind === "face-symbol-bend") return { from: effect.from_symbol, to: effect.to_symbol };
  if (effect.kind === "compound") {
    for (const e of effect.effects) {
      const b = findSymbolBend(e);
      if (b) return b;
    }
  }
  return null;
}

/** Does the effect tree contain a set-die-face with a player-chosen face? */
function hasPlayerFaceSetter(effect: import("./types").AbilityEffect): boolean {
  if (effect.kind === "set-die-face") return effect.target.kind === "face" && effect.target.faceValue == null;
  if (effect.kind === "compound") return effect.effects.some(hasPlayerFaceSetter);
  return false;
}

function pickBestDefense(state: GameState, ai: PlayerId): number | null {
  const me = state.players[ai];
  const dl = me.activeDefense;
  if (!dl || dl.length === 0) return null;
  const incoming = state.pendingAttack?.incomingAmount ?? 0;

  const flatReduce = (e: import("./types").AbilityEffect): number => {
    if (e.kind === "reduce-damage") return e.negate_attack ? 99 : (e.multiplier != null ? Math.ceil(incoming * (1 - e.multiplier)) : e.amount);
    if (e.kind === "compound") return e.effects.reduce((a, x) => a + flatReduce(x), 0);
    return 0;
  };
  const healAmount = (e: import("./types").AbilityEffect): number => {
    if (e.kind === "heal") return e.amount;
    if (e.kind === "compound") return e.effects.reduce((a, x) => a + healAmount(x), 0);
    return 0;
  };

  // 1) A reduce that fully blocks the hit wins outright.
  for (let i = 0; i < dl.length; i++) {
    if (flatReduce(dl[i].effect) >= incoming && incoming > 0) return i;
  }
  // 2) Low HP → the biggest heal keeps us alive past this attack.
  if (me.hp <= me.hpStart * 0.4) {
    let bestIdx = -1; let bestHeal = 0;
    for (let i = 0; i < dl.length; i++) {
      const h = healAmount(dl[i].effect);
      if (h > bestHeal) { bestHeal = h; bestIdx = i; }
    }
    if (bestIdx >= 0) return bestIdx;
  }
  // 3) Otherwise highest tier (legacy heuristic).
  let bestIdx = 0;
  let bestTier = -1;
  for (let i = 0; i < dl.length; i++) {
    if (dl[i].tier > bestTier) { bestTier = dl[i].tier; bestIdx = i; }
  }
  return bestIdx;
}

// ── Main pre-roll: play cards, then ROLL ────────────────────────────────────
function decideMainPre(state: GameState, ai: PlayerId, profile: AiProfile): Action {
  const me = state.players[ai];
  const opponent = state.players[other(ai)];
  void opponent;

  // §15.2: holder-paid status removal. If we carry a status with a
  // `holderRemovalActions[]` entry and the cost is affordable AND the
  // stacks are high enough to be worth the spend, trigger atonement.
  // Without this the AI can sit under permanently-applied debuffs (e.g.
  // Verdict's -2 dmg/stack) and stall the match indefinitely.
  const atone = pickHolderRemovalAction(me);
  if (atone) {
    return { kind: "status-holder-action", status: atone.status, actionIndex: atone.actionIndex };
  }

  // 0) Masteries first — they're permanent upgrades and only occupy a
  // hero-upgrade slot once. Play whichever's affordable AND whose slot
  // isn't already filled. Higher tier masteries first (defensive →
  // T3 → T2 → T1) so we lock in the biggest leverage when CP allows.
  const masteryOrder: Array<1 | 2 | 3 | "defensive"> = ["defensive", 3, 2, 1];
  for (const tier of masteryOrder) {
    if (me.masterySlots[tier]) continue;
    const card = me.hand.find(c =>
      c.kind === "mastery"
      && c.masteryTier === tier
      && canPlay(state, me, opponent, c),
    );
    if (card) return { kind: "play-card", card: card.id };
  }

  // 1) Removal: Cleanse strips up to 2 stacks of any self debuff — worth
  // the 2 CP once meaningful pressure has accumulated (3+ debuff stacks).
  const myDebuffStacks = me.statuses.reduce((sum, s) => {
    const def = getStatusDef(s.id);
    return def?.type === "debuff" ? sum + s.stacks : sum;
  }, 0);
  if (myDebuffStacks >= 3 && me.hand.find(c => c.id === "generic/cleanse" && c.cost <= me.cp)) {
    return { kind: "play-card", card: "generic/cleanse" };
  }

  // 2) Quick Draw / Focus when CP and hand allow — generic resource cards.
  const draw = me.hand.find(c => c.id === "generic/quick-draw" && c.cost <= me.cp);
  if (draw && me.hand.length <= 3) return { kind: "play-card", card: draw.id };
  const focus = me.hand.find(c => c.id === "generic/focus" && c.cost <= me.cp);
  if (focus && me.cp <= 4) return { kind: "play-card", card: focus.id };

  // 2b) Hero-specific main-phase plays. Each card is hand-tuned —
  // until cards declare their own AI heuristics, this dispatch table
  // hard-codes the priority. The decisions are intentionally coarse
  // (cost-affordable + simple state precondition) so the heuristic
  // doesn't over-fit; we want the cards to *fire* from the AI, not
  // necessarily fire optimally.
  const heroCard = pickHeroMainPhaseCard(state, ai, profile);
  if (heroCard) return { kind: "play-card", card: heroCard };

  // 3) Sell the oldest card to fund next turn if hand is overflowing.
  if (me.hand.length >= 5 && me.cp < 6) {
    return { kind: "sell-card", card: me.hand[0].id };
  }

  // Hero-specific cards plug in via additional rules added by content
  // modules. For now: only generic logic above.

  // Otherwise: roll.
  return { kind: "roll-dice" };
}

// ── Offensive roll: lock dice contributing to best target tier ──────────────
function decideOffensiveRoll(state: GameState, ai: PlayerId, profile: AiProfile): Action {
  const me = state.players[ai];
  const opponent = state.players[other(ai)];
  const hero = getHero(me.hero);

  // If we have rolls left, lock optimally then return roll-dice.
  if (me.rollAttemptsRemaining > 0) {
    // First, we must have rolled at least once already
    // (rollAttemptsRemaining < ROLL_ATTEMPTS means at least one attempt used).
    if (me.rollAttemptsRemaining < ROLL_ATTEMPTS) {
      // If any ability is currently firing, pin the target to the highest
      // firing tier. This avoids the lock/reachability oscillation where
      // pickTargetTier flip-flops between tiers as we toggle locks.
      // Face-aware match — symbol-only `comboMatches` misses n-of-a-kind
      // and straight combos, which would leave firingTier=-1 and dump
      // every decision through the unstable pickTargetTier path.
      const symbols = symbolsOnDice(me.dice);
      const faces = me.dice.map(d => d.faces[d.current]);
      const resolved = me.activeOffense.map(a => resolveAbilityFor(me, a, "offensive"));
      let firingTier = -1;
      for (let i = 0; i < resolved.length; i++) {
        if (comboMatchesFaces(resolved[i].combo, faces)) firingTier = i;
      }
      const targetTier = firingTier >= 0 ? firingTier : pickTargetTier(state, ai, profile);

      // One symbol short of the target combo? A set-die-face card (Iron
      // Focus) closes the gap — without this, a quarter of every deck
      // (dice-manipulation) was dead weight in the AI's hands.
      if (firingTier === -1 && targetTier >= 0) {
        const targetCombo = resolved[targetTier].combo;
        if (targetCombo.kind === "symbol-count" || targetCombo.kind === "at-least" || targetCombo.kind === "matching") {
          const have = symbols.filter(sym => sym === targetCombo.symbol).length;
          if (targetCombo.count - have === 1) {
            const setter = me.hand.find(c =>
              (c.kind === "roll-phase" || c.kind === "roll-action")
              && hasPlayerFaceSetter(c.effect)
              && canPlay(state, me, opponent, c),
            );
            const face = hero.diceIdentity.faces.find(f => f.symbol === targetCombo.symbol);
            if (setter && face) {
              return { kind: "play-card", card: setter.id, casterPlayer: ai, targetFaceValue: face.faceValue };
            }
          }
          // A symbol-bend card (Pelt of the Wolf, Faith) completes the combo
          // when bent dice make up the shortfall.
          if (have < targetCombo.count) {
            for (const card of me.hand) {
              if (card.kind !== "roll-phase" && card.kind !== "roll-action") continue;
              const bend = findSymbolBend(card.effect);
              if (!bend || bend.to !== targetCombo.symbol) continue;
              const donors = symbols.filter(sym => sym === bend.from).length;
              if (have + donors < targetCombo.count) continue;
              if (!canPlay(state, me, opponent, card)) continue;
              return { kind: "play-card", card: card.id, casterPlayer: ai };
            }
          }
        }
      }
      if (targetTier >= 0) {
        const ability = resolved[targetTier];
        const keep = pickKeepMask(ability.combo, symbols, faces.map(f => f.faceValue));
        // Monotonic lock policy: only LOCK a die that the keep mask wants
        // locked. Never UNLOCK mid-attempt — `pickTargetTier`'s MC depends
        // on current locks, so an unlock could flip the target tier and
        // produce a different keep mask, causing an infinite toggle cycle.
        // Locks naturally reset at `passTurn` so this is purely scoped
        // to the current attempt.
        for (let i = 0; i < me.dice.length; i++) {
          if (keep[i] && !me.dice[i].locked) {
            return { kind: "toggle-die-lock", die: i as 0|1|2|3|4 };
          }
        }
      }
      // Locks match the keep mask. Already firing at or above the
      // profile's commit tier? Commit; otherwise burn the remaining
      // attempt to fish for an upgrade. (Squire commits on ANY firing
      // combo; Champion/Nightmare hold out for T3+.)
      if (firingTier >= profile.commitTier) {
        // Nightmare's edge: the firing combo's dice are locked, so
        // rerolling the free dice can only upgrade the row. Keep fishing
        // while a higher row is genuinely reachable.
        if (profile.fishHigherProb != null && firingTier < me.activeOffense.length - 1) {
          const rows = evaluateLadder(hero, me, me.rollAttemptsRemaining, {
            opponentHp: opponent.hp,
            pendingOpponentDamage: stacksOf(opponent, "burn"),
            damageBonus: (me.signatureState["frenzy"] ?? 0) + me.nextAbilityBonusDamage,
            reachabilitySamples: profile.reachabilitySamples,
            reachabilitySeed: state.rngSeed,
          });
          const fishable = rows.slice(firingTier + 1).some(r =>
            r.kind === "reachable" && r.probability >= profile.fishHigherProb!,
          );
          if (fishable) return { kind: "roll-dice" };
        }
        return { kind: "advance-phase" };
      }
      return { kind: "roll-dice" };
    }
    // First attempt (rollAttemptsRemaining === ROLL_ATTEMPTS): just roll.
    return { kind: "roll-dice" };
  }

  // No rolls left — commit by advancing the phase.
  void opponent;
  return { kind: "advance-phase" };
}

function pickTargetTier(state: GameState, ai: PlayerId, profile: AiProfile = AI_PROFILES.champion): number {
  const me = state.players[ai];
  const opponent = state.players[other(ai)];
  const hero = getHero(me.hero);
  const rows = evaluateLadder(hero, me, me.rollAttemptsRemaining, {
    opponentHp: opponent.hp,
    pendingOpponentDamage: stacksOf(opponent, "burn"),
    damageBonus: (me.signatureState["frenzy"] ?? 0) + me.nextAbilityBonusDamage,
    reachabilitySamples: profile.reachabilitySamples,
    reachabilitySeed: state.rngSeed,
  });
  // Lethal commitment override — the profile decides how faint a kill
  // scent is worth chasing.
  const lethal = rows.findIndex(r =>
    (r.kind === "firing" || r.kind === "triggered" || (r.kind === "reachable" && r.probability >= profile.lethalCommitProb))
    && "lethal" in r && r.lethal,
  );
  if (lethal >= 0) return lethal;
  // Highest reachable with EV weighting (prefer higher tier when prob ≥ 0.25).
  let best = -1; let bestScore = -Infinity;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    let prob: number; let tierScore: number;
    if (r.kind === "firing" || r.kind === "triggered") { prob = 1; tierScore = (i + 1) * 4; }
    else if (r.kind === "reachable") { prob = r.probability; tierScore = (i + 1) * 4 * prob; }
    else continue;
    const score = tierScore + (prob >= 0.25 ? i * 0.5 : 0);
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

/** Unused after pinning the target to the highest firing tier — kept for
 *  reference/follow-up if we revive the oscillating eval path. */
function locksAreOptimal(state: GameState, ai: PlayerId): boolean {
  const me = state.players[ai];
  const target = pickTargetTier(state, ai);
  if (target < 0) return true;
  const ability = resolveAbilityFor(me, me.activeOffense[target], "offensive");
  const symbols = symbolsOnDice(me.dice);
  const keep = pickKeepMask(ability.combo, symbols);
  for (let i = 0; i < me.dice.length; i++) {
    if (me.dice[i].locked !== keep[i]) return false;
  }
  return true;
}
void locksAreOptimal;

/** Hand-tuned per-card priority for hero-specific main-phase plays.
 *  Returns the card id to play (or null). Each entry tests affordability,
 *  card kind, and a card-specific precondition. Iterate the player's
 *  hand for the FIRST matching card so order = priority. */
function pickHeroMainPhaseCard(state: GameState, ai: PlayerId, profile: AiProfile): string | null {
  const me = state.players[ai];
  const opp = state.players[other(ai)];
  for (const card of me.hand) {
    // Defer the full legality check to canPlay — it covers cost,
    // playCondition, state-threshold blocks (Verdict at 3+ blocks
    // main-phase cards on the holder), once-per-match / once-per-turn,
    // and phase. Without this guard the AI can pick a card the engine
    // then refuses, producing a no-op action and an infinite loop.
    if (card.kind !== "main-phase" && card.kind !== "main-action") continue;
    if (!canPlay(state, me, opp, card)) continue;

    switch (card.id) {
      // Lightbearer
      case "lightbearer/sanctuary":
        // Play when wounded (HP < 60%) — pre-emptive damage soak.
        if (me.hp / me.hpStart < 0.6) return card.id;
        break;
      case "lightbearer/vow-of-service":
        // Long-term economic buff — play first chance.
        return card.id;
      case "lightbearer/dawnsong":
        // Burn 2 Radiance for +4 CP when CP-starved.
        if ((me.signatureState["radiance"] ?? 0) >= 3 && me.cp <= 4) return card.id;
        break;
      case "lightbearer/resolve":
        // Cheap dice-bend — play when dawn faces are showing.
        if (me.dice.some(d => d.faces[d.current].symbol === "lightbearer:dawn")) return card.id;
        break;
      // Berserker (existing hero — fill in obvious plays)
      case "berserker/ancestral-spirits":
        // Persistent +1 dmg buff — play first chance.
        return card.id;
      case "berserker/war-cry":
        // Frenzy bump — play when below cap.
        if ((me.signatureState["frenzy"] ?? 0) <= 3) return card.id;
        break;
      case "berserker/hunters-mark":
        // Status apply on opponent — always good early.
        return card.id;
      // Pyromancer
      case "pyromancer/crater-wind":
        // Boost Cinder detonation — play first chance once Cinder is a thing.
        if ((opp.statuses.find(s => s.id === "pyromancer:cinder")?.stacks ?? 0) >= 1) return card.id;
        return card.id;
      case "pyromancer/phoenix-stir":
        // Once-per-match burst heal — spend it wounded, and prefer waiting
        // for 3+ opponent Cinder (heal 8 instead of 5) unless critical.
        if (me.hp / me.hpStart < 0.35) return card.id;
        if (me.hp / me.hpStart < 0.65
          && (opp.statuses.find(s => s.id === "pyromancer:cinder")?.stacks ?? 0) >= 3) return card.id;
        break;
      case "pyromancer/char":
        // Direct 3 Cinder — strongest when it threatens detonation (5).
        if ((opp.statuses.find(s => s.id === "pyromancer:cinder")?.stacks ?? 0) >= 2) return card.id;
        if (me.cp >= card.cost + 2) return card.id;
        break;
      default:
        // Unlisted hero card: play it when CP-rich — a 25% dead deck reads
        // as a broken opponent. The profile cushion keeps the AI from
        // going broke on cards the whitelist hasn't hand-tuned.
        if (me.cp >= card.cost + profile.unlistedCardCushion) return card.id;
        break;
    }
  }
  return null;
}

/** §15.2: scan the holder's statuses for a `holderRemovalActions[]` entry
 *  worth invoking now. Picks the first action whose cost is affordable
 *  and whose stack count is "worth" stripping — defined as either ≥ the
 *  smallest `stateThresholdEffects.threshold` on the status (so we
 *  evict before the bind fires) or ≥ 75% of `stackLimit`. Returns
 *  `{ status, actionIndex }` or `null`. */
function pickHolderRemovalAction(holder: import("./types").HeroSnapshot): { status: StatusId; actionIndex: number } | null {
  for (const inst of holder.statuses) {
    const def = getStatusDef(inst.id);
    const actions = def?.holderRemovalActions;
    if (!def || !actions || actions.length === 0) continue;

    // "Worth it" threshold: smallest threshold among stateThresholdEffects,
    // or 75% of stackLimit when no thresholds are declared. Statuses that
    // sap our damage every attack (Verdict) are worth clearing from 2
    // stacks — waiting for the card-bind threshold bleeds whole turns.
    const damageSapping = (def.passiveModifier?.valuePerStack ?? 0) < 0
      && def.passiveModifier?.field === "damage";
    const lowestThreshold = def.stateThresholdEffects?.length
      ? Math.min(...def.stateThresholdEffects.map(s => s.threshold))
      : Math.ceil(def.stackLimit * 0.75);
    const worthAt = damageSapping ? Math.min(2, lowestThreshold) : lowestThreshold;
    if (inst.stacks < worthAt) continue;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const affordable =
        action.cost.resource === "cp"           ? holder.cp >= action.cost.amount :
        action.cost.resource === "hp"           ? holder.hp >  action.cost.amount + 4 : // keep a 4-HP cushion
        action.cost.resource === "discard-card" ? holder.hand.length >= action.cost.amount + 1 :
        false;
      if (!affordable) continue;
      return { status: inst.id, actionIndex: i };
    }
  }
  return null;
}

// ── Main post-roll: play follow-up cards, then end turn ─────────────────────
function decideMainPost(state: GameState, ai: PlayerId): Action {
  const me = state.players[ai];
  // §15.2 atonement is also valid during main-post.
  const atone = pickHolderRemovalAction(me);
  if (atone) {
    return { kind: "status-holder-action", status: atone.status, actionIndex: atone.actionIndex };
  }
  // Cheap CP-fueled plays only — most decisions happen pre-roll.
  if (me.cp >= 1 && me.hand.find(c => c.id === "generic/focus" && c.cost === 0)) {
    return { kind: "play-card", card: "generic/focus" };
  }
  // Sell extras if we're at/over hand cap.
  if (me.hand.length >= HAND_CAP) return { kind: "sell-card", card: me.hand[0].id };
  return { kind: "end-turn" };
}

// ── Counter-prompt response ─────────────────────────────────────────────────
function shouldAcceptCounter(state: GameState, ai: PlayerId): boolean {
  const pending = state.pendingCounter;
  if (!pending) return false;
  // For MVP: cheap heuristic — accept if expected damage prevented ≥ 4.
  const card = pending.card;
  if (card.effect.kind === "damage") return card.effect.amount >= 2;
  void ai;
  return true;
}

function other(p: PlayerId): PlayerId { return p === "p1" ? "p2" : "p1"; }
