/**
 * Chaos playtest — plays like a messy human, through the real DOM.
 *
 * Beyond scripts/playtest.mjs (happy path), this harness:
 *   - taps hand cards and plays or sells them via the card modal
 *   - activates abilities through the ladder-row modal
 *   - toggles die locks mid-roll
 *   - tries instants while defending
 *   - uses the spend stepper
 *   - rematches from the summary, and reload-resumes mid-match
 *
 * It records every "dead tap" — a Play/Activate that produced zero state
 * change — plus stalls and page errors. Dead taps are the "button does
 * nothing" class of bug.
 *
 * Usage: node scripts/chaos.mjs [--matches N] [--seed N]
 */

import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? dflt : Number(args[i + 1])
}
const MATCHES = flag('matches', 3)
let rngState = flag('seed', 1234) >>> 0
const rand = () => {
  // xorshift32 — reproducible chaos
  rngState ^= rngState << 13; rngState >>>= 0
  rngState ^= rngState >> 17
  rngState ^= rngState << 5; rngState >>>= 0
  return rngState / 0xffffffff
}

const BASE = 'http://localhost:5173'
const STALL_MS = 18000

const deadTaps = []
const pageErrors = []
const oddities = []

function log(...p) { console.log(new Date().toISOString().slice(11, 19), ...p) }

async function snap(page) {
  return page.evaluate(() => {
    const g = window.__poh?.game.getState()
    const u = window.__poh?.ui.getState()
    if (!g || !u) return null
    const s = g.state
    const me = s?.players?.p1
    return {
      hasState: !!s,
      phase: s?.phase ?? null,
      turn: s?.turn ?? null,
      active: s?.activePlayer ?? null,
      winner: s?.winner ?? null,
      p1hp: s?.players?.p1?.hp ?? null,
      p2hp: s?.players?.p2?.hp ?? null,
      cp: me?.cp ?? null,
      hand: me?.hand?.map(c => ({ id: c.id, kind: c.kind, cost: c.cost, name: c.name })) ?? [],
      rolls: s ? s.players[s.activePlayer]?.rollAttemptsRemaining : null,
      pa: s?.pendingAttack ? { defender: s.pendingAttack.defender, type: s.pendingAttack.damageType } : null,
      poc: s?.pendingOffensiveChoice ? { attacker: s.pendingOffensiveChoice.attacker, n: s.pendingOffensiveChoice.matches.length } : null,
      pbs: s?.pendingBankSpend ? { holder: s.pendingBankSpend.holder, available: s.pendingBankSpend.available } : null,
      psr: s?.pendingStatusRemoval ? { holder: s.pendingStatusRemoval.holder } : null,
      logLen: g.matchLog.length,
      qLen: u.resolutionQueue.length,
      res: u.currentResolution?.scene?.kind ?? null,
      overlay: u.activeOverlay,
    }
  })
}

const bar = (page) => page.locator('[data-band="action-bar"]')
async function clickBar(page, name) {
  try {
    await bar(page).getByRole('button', { name, exact: false }).first().click({ timeout: 2000 })
    return true
  } catch { return false }
}

/** Tap a hand card by id, then press an action in the card modal. */
async function cardModalAction(page, cardId, action, s) {
  const card = page.locator(`[data-band="hand"] [data-card-id="${cardId}"]`).first()
  if (!(await card.isVisible().catch(() => false))) return 'not-visible'
  await card.click({ timeout: 1500 }).catch(() => 'tap-failed')
  await page.waitForTimeout(250)
  const modalUp = await page.evaluate(() => window.__poh.ui.getState().activeOverlay === 'card')
  if (!modalUp) return 'modal-no-open'
  const before = s.logLen
  const btn = page.getByRole('button', { name: action, exact: false }).first()
  const enabled = await btn.isEnabled().catch(() => false)
  if (!enabled || !(await btn.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Cancel' }).first().click().catch(() => {})
    return 'action-disabled'
  }
  await btn.click({ timeout: 1500 }).catch(() => {})
  await page.waitForTimeout(350)
  const after = await snap(page)
  if (after && after.logLen === before && after.overlay !== 'card') return 'dead'
  if (after && after.overlay === 'card') {
    // modal still open — close it
    await page.getByRole('button', { name: 'Cancel' }).first().click().catch(() => {})
    return 'still-open'
  }
  return 'ok'
}

async function playMatch(page, matchIdx, { doResumeTest }) {
  await page.goto(`${BASE}/heroes`)
  await page.waitForFunction(() => !!window.__poh, { timeout: 15000 })
  const pickRows = page.locator('[class*=pickRow]')
  await pickRows.nth(0).locator('[class*=pickCard]').nth(matchIdx % 3).click()
  await pickRows.nth(1).locator('[class*=pickCard]').nth((matchIdx + 1) % 3).click()
  await page.getByRole('button', { name: 'Begin Match' }).click()
  await page.waitForFunction(() => !!window.__poh?.game.getState().state, { timeout: 10000 })
  log(`match ${matchIdx + 1} started (${matchIdx % 3} vs ${(matchIdx + 1) % 3})`)
  await page.waitForTimeout(500)
  await page.locator('div').filter({ hasText: /tap to skip/ }).last().click({ force: true }).catch(() => {})

  let lastKey = ''
  let lastAt = Date.now()
  let resumeTested = !doResumeTest

  for (let step = 0; step < 4000; step++) {
    const s = await snap(page)
    if (!s || !s.hasState) {
      if (page.url().includes('/summary')) return { ok: true }
      await page.waitForTimeout(300)
      continue
    }
    if (s.winner) {
      log(`  winner ${s.winner} turn ${s.turn} (hp ${s.p1hp}/${s.p2hp})`)
      await page.waitForTimeout(2500)
      return { ok: true, winner: s.winner }
    }

    const key = JSON.stringify([s.phase, s.turn, s.active, s.logLen, s.qLen, s.res, s.rolls, s.pa, s.poc, s.pbs, s.psr, s.overlay])
    if (key !== lastKey) { lastKey = key; lastAt = Date.now() }
    else if (Date.now() - lastAt > STALL_MS) {
      console.error('STALL:', JSON.stringify(s))
      await page.screenshot({ path: `chaos-stall-m${matchIdx}.png` })
      return { ok: false, stall: s }
    }

    if (s.res) { await page.waitForTimeout(250); continue }

    // Mid-match reload → Home → Resume test (once), while it's our turn with no prompt.
    if (!resumeTested && s.turn >= 3 && s.active === 'p1' && !s.pa && !s.poc && !s.pbs && !s.psr && s.phase === 'main-pre') {
      resumeTested = true
      log('  testing reload → resume…')
      await page.waitForTimeout(600) // let the debounced save land
      await page.goto(`${BASE}/`)
      await page.waitForFunction(() => !!window.__poh, { timeout: 15000 })
      await page.waitForTimeout(400)
      const resumed = await page.getByRole('button', { name: 'Resume Match' }).first()
        .click({ timeout: 3000 }).then(() => true).catch(() => false)
      if (!resumed) { oddities.push('resume-button-missing after reload with saved match'); return { ok: false, stall: 'resume-missing' } }
      await page.waitForFunction(() => !!window.__poh?.game.getState().state, { timeout: 10000 })
      log('  resumed ok')
      lastAt = Date.now()
      continue
    }

    // Escape wedged inspection modals.
    if (s.overlay === 'ability' || s.overlay === 'card') {
      await page.getByRole('button', { name: 'Cancel' }).first().click().catch(() => {})
      await page.waitForTimeout(150)
      const still = await page.evaluate(() => window.__poh.ui.getState().activeOverlay)
      if (still === s.overlay) {
        oddities.push(`overlay ${s.overlay} did not close on Cancel`)
        await page.evaluate(() => window.__poh.ui.getState().setOverlay('none'))
      }
      continue
    }

    // ── Viewer prompts ──────────────────────────────────────────────
    // Bank spend outranks the defense pick (both can be set at once
    // during a defensive-resolution spend — mirrors the action bar).
    if (s.pbs && s.pbs.holder === 'p1') {
      // Exercise the stepper sometimes.
      if (rand() < 0.5) {
        await page.locator('[data-overlay="spend"]').getByRole('button', { name: /less/ }).click().catch(() => {})
      }
      if (!(await clickBar(page, 'Confirm Spend'))) await clickBar(page, 'Skip Spend')
      await page.waitForTimeout(250)
      continue
    }

    if (s.pa && s.pa.defender === 'p1') {
      // Sometimes try an instant from hand first.
      const instant = s.hand.find(c => c.kind === 'instant' && c.cost <= s.cp)
      if (instant && rand() < 0.4) {
        const r = await cardModalAction(page, instant.id, 'Play', s)
        if (r === 'dead') deadTaps.push({ where: 'instant-during-defense', card: instant.id, phase: s.phase })
        await page.waitForTimeout(200)
        continue
      }
      const defendable = s.pa.type === 'normal' || s.pa.type === 'collateral'
      if (defendable && rand() < 0.7) {
        await page.locator('[data-overlay="defensive"]').getByRole('button').nth(rand() < 0.5 ? 0 : 1).click().catch(() => {})
        await page.waitForTimeout(150)
        await clickBar(page, 'Confirm Defense')
      } else {
        await clickBar(page, defendable ? 'Take Hit' : 'Brace')
      }
      await page.waitForTimeout(250)
      continue
    }
    if (s.poc && s.poc.attacker === 'p1') {
      const prompt = page.locator('[data-overlay="offensive-pick"]')
      const rows = prompt.getByRole('button').filter({ hasText: /T\d/ })
      const n = await rows.count().catch(() => 0)
      if (n > 0) {
        await rows.nth(Math.floor(rand() * n)).click().catch(() => {})
        await page.waitForTimeout(150)
        if (rand() < 0.15) await prompt.getByRole('button', { name: 'Fizzle' }).click().catch(() => {})
        else await prompt.getByRole('button', { name: 'Fire' }).click().catch(() => {})
      }
      await page.waitForTimeout(250)
      continue
    }
    if (s.psr && s.psr.holder === 'p1') {
      await page.getByRole('button', { name: /Decline|No/i }).first().click().catch(() => {})
      await page.waitForTimeout(250)
      continue
    }

    if (s.active !== 'p1') { await page.waitForTimeout(300); continue }

    // ── Our turn ────────────────────────────────────────────────────
    if (s.phase === 'main-pre' || s.phase === 'main-post') {
      // Maybe play or sell a card first.
      if (s.hand.length > 0 && rand() < 0.45) {
        const mainish = s.hand.filter(c => c.kind !== 'instant' && c.cost <= s.cp)
        const pick = (mainish.length ? mainish : s.hand)[Math.floor(rand() * (mainish.length ? mainish.length : s.hand.length))]
        const action = rand() < 0.75 ? 'Play' : 'Sell'
        const r = await cardModalAction(page, pick.id, action, s)
        if (r === 'dead') deadTaps.push({ where: `${action.toLowerCase()}-${s.phase}`, card: pick.id, kind: pick.kind })
        await page.waitForTimeout(200)
        continue
      }
      if (s.phase === 'main-pre') await clickBar(page, 'Roll')
      else await clickBar(page, 'End Turn')
      await page.waitForTimeout(250)
      continue
    }

    if (s.phase === 'offensive-roll') {
      const r = rand()
      if (r < 0.2 && s.rolls > 0) {
        // toggle a random die lock
        const dice = page.locator('[data-band="dice-tray"]').getByRole('button')
        const n = await dice.count().catch(() => 0)
        if (n > 0) await dice.nth(Math.floor(rand() * n)).click().catch(() => {})
        await page.waitForTimeout(150)
      } else if (r < 0.35) {
        // roll-phase card?
        const rollCard = s.hand.find(c => (c.kind === 'roll-phase' || c.kind === 'roll-action') && c.cost <= s.cp)
        if (rollCard) {
          const res = await cardModalAction(page, rollCard.id, 'Play', s)
          if (res === 'dead') deadTaps.push({ where: 'play-offensive-roll', card: rollCard.id })
        }
        await page.waitForTimeout(150)
      } else if (r < 0.55) {
        // Activate via the ability modal: tap an eligible ladder row.
        const rows = page.locator('[data-band="middle"]').getByRole('button')
        const n = await rows.count().catch(() => 0)
        if (n > 0) {
          await rows.nth(Math.floor(rand() * n)).click().catch(() => {})
          await page.waitForTimeout(300)
          const before = (await snap(page))?.logLen ?? 0
          const act = page.getByRole('button', { name: /Activate|Lethal Strike/ }).first()
          if (await act.isEnabled().catch(() => false)) {
            await act.click().catch(() => {})
            await page.waitForTimeout(400)
            const after = await snap(page)
            if (after && after.logLen === before) deadTaps.push({ where: 'ability-activate' })
          } else {
            await page.getByRole('button', { name: 'Cancel' }).first().click().catch(() => {})
          }
        }
      } else if (r < 0.75 && s.rolls > 0) {
        await clickBar(page, 'Reroll')
      } else {
        await clickBar(page, 'Fire')
      }
      await page.waitForTimeout(250)
      continue
    }

    await page.waitForTimeout(250)
  }
  return { ok: false, reason: 'max-steps' }
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium' })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('pageerror', (err) => { pageErrors.push(String(err).slice(0, 400)); console.error('[pageerror]', String(err).slice(0, 200)) })
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION')) console.error('[console.error]', m.text().slice(0, 200))
  })

  let failures = 0
  for (let i = 0; i < MATCHES; i++) {
    const r = await playMatch(page, i, { doResumeTest: i === 1 })
    if (!r.ok) { failures++; console.error(`match ${i + 1} FAILED`, JSON.stringify(r).slice(0, 300)) }
    else {
      // Exercise rematch from summary on the first match.
      if (i === 0 && page.url().includes('/summary')) {
        log('  testing rematch…')
        await page.getByRole('button', { name: 'Rematch' }).click().catch(() => {})
        await page.waitForTimeout(1500)
        const st = await snap(page)
        if (!st?.hasState || st.winner) { oddities.push('rematch did not start a fresh match'); failures++ }
        else {
          log('  rematch ok — conceding to return to summary')
          await page.evaluate(() => window.__poh.game.getState().dispatch({ kind: 'concede', player: 'p1' }))
          await page.waitForTimeout(2500)
        }
      }
      log(`match ${i + 1} ✔`)
    }
  }

  await browser.close()
  console.log('\n=== CHAOS REPORT ===')
  console.log('failures:', failures)
  console.log('pageErrors:', JSON.stringify(pageErrors, null, 1))
  console.log('deadTaps:', JSON.stringify(deadTaps, null, 1))
  console.log('oddities:', JSON.stringify(oddities, null, 1))
  if (failures > 0 || pageErrors.length > 0) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
