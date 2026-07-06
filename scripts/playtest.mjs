/**
 * E2E playtest harness — drives a full match against the AI through the real
 * DOM (the exact same taps a player makes) and fails loudly on any stall.
 *
 * Usage:
 *   node scripts/playtest.mjs [--matches N] [--headed] [--url http://localhost:5173]
 *
 * Requires the dev server to be running (npm run dev) and the dev-only
 * `window.__poh` store handle (installed by src/main.tsx under DEV).
 */

import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return dflt
  const v = args[i + 1]
  return v && !v.startsWith('--') ? v : true
}

const BASE_URL = flag('url', 'http://localhost:5173')
const MATCHES = Number(flag('matches', 1))
const HEADED = args.includes('--headed')
const STALL_MS = 15000
const MAX_STEPS = 2500

const EXEC = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium'

function log(...parts) {
  console.log(new Date().toISOString().slice(11, 19), ...parts)
}

async function snapshot(page) {
  return page.evaluate(() => {
    const poh = window.__poh
    if (!poh) return null
    const g = poh.game.getState()
    const u = poh.ui.getState()
    const s = g.state
    return {
      hasState: !!s,
      phase: s?.phase ?? null,
      turn: s?.turn ?? null,
      activePlayer: s?.activePlayer ?? null,
      winner: s?.winner ?? null,
      p1hp: s?.players?.p1?.hp ?? null,
      p2hp: s?.players?.p2?.hp ?? null,
      p1cp: s?.players?.p1?.cp ?? null,
      p2cp: s?.players?.p2?.cp ?? null,
      pendingAttack: s?.pendingAttack ? { defender: s.pendingAttack.defender, amount: s.pendingAttack.incomingAmount } : null,
      pendingOffensiveChoice: s?.pendingOffensiveChoice ? { attacker: s.pendingOffensiveChoice.attacker, n: s.pendingOffensiveChoice.matches.length } : null,
      pendingBankSpend: s?.pendingBankSpend ? { holder: s.pendingBankSpend.holder, available: s.pendingBankSpend.available } : null,
      pendingStatusRemoval: s?.pendingStatusRemoval ? { holder: s.pendingStatusRemoval.holder } : null,
      pendingCounter: s?.pendingCounter ? { holder: s.pendingCounter.holder } : null,
      rolls: s?.players?.[s.activePlayer]?.rollAttemptsRemaining ?? null,
      logLen: g.matchLog.length,
      queueLen: u.resolutionQueue.length,
      currentRes: u.currentResolution?.scene?.kind ?? null,
      overlay: u.activeOverlay,
      viewerId: u.viewerId,
    }
  })
}

async function clickButton(page, label, { force = false } = {}) {
  const btn = page.getByRole('button', { name: label, exact: false }).first()
  try {
    await btn.click({ timeout: 2500, force })
    return true
  } catch {
    return false
  }
}

/** Click a button inside the ActionBar band only — bare-text matching leaks
 *  onto ladder rows ("Fire" ↔ "Firestorm"). */
async function clickBar(page, label) {
  const btn = page
    .locator('[data-band="action-bar"]')
    .getByRole('button', { name: label, exact: false })
    .first()
  try {
    await btn.click({ timeout: 2500 })
    return true
  } catch {
    return false
  }
}

async function playMatch(page, matchIdx) {
  log(`— match ${matchIdx + 1}: navigating to hero select`)
  await page.goto(`${BASE_URL}/heroes`)
  await page.waitForFunction(() => !!window.__poh, { timeout: 15000 })

  // Vary the matchup a bit across runs.
  const heroCards = page.locator('[class*=heroCard]')
  await heroCards.first().waitFor({ timeout: 10000 })
  const youIdx = matchIdx % 3
  const oppIdx = (matchIdx + 1) % 3
  const youCards = page.locator('section', { hasText: 'You' }).first().locator('[class*=heroCard]')
  const oppCards = page.locator('section', { hasText: 'Opponent' }).first().locator('[class*=heroCard]')
  await youCards.nth(youIdx).click()
  await oppCards.nth(oppIdx).click()

  await clickButton(page, 'Begin Match')
  await page.waitForFunction(() => !!window.__poh?.game.getState().state, { timeout: 10000 })
  log(`  match started`)

  // Skip the intro cinematic if it's up.
  await page.waitForTimeout(400)
  const intro = page.locator('[class*=MatchIntro], [class*=overlay]:has-text("Match begins")').first()
  if (await intro.isVisible().catch(() => false)) {
    await intro.click({ force: true }).catch(() => {})
  }

  let lastProgressKey = ''
  let lastProgressAt = Date.now()
  const history = []

  for (let step = 0; step < MAX_STEPS; step++) {
    const s = await snapshot(page)
    if (!s || !s.hasState) {
      // Match ended and store reset, or we navigated to summary.
      const onSummary = page.url().includes('/summary')
      if (onSummary) return { ok: true, turns: history.at(-1)?.turn ?? 0 }
      await page.waitForTimeout(300)
      continue
    }

    if (s.winner) {
      log(`  ✅ winner: ${s.winner} on turn ${s.turn} (p1 ${s.p1hp}hp / p2 ${s.p2hp}hp)`)
      // Give redirect a beat, then verify summary screen shows.
      await page.waitForTimeout(1500)
      return { ok: true, turns: s.turn, winner: s.winner }
    }

    // Progress detection — anything that changes counts as progress.
    const key = JSON.stringify([s.phase, s.turn, s.activePlayer, s.logLen, s.queueLen, s.currentRes, s.rolls,
      s.pendingAttack, s.pendingOffensiveChoice, s.pendingBankSpend, s.pendingStatusRemoval])
    if (key !== lastProgressKey) {
      lastProgressKey = key
      lastProgressAt = Date.now()
      history.push(s)
      if (history.length % 10 === 0) {
        log(`  t${s.turn} ${s.activePlayer} ${s.phase} | hp ${s.p1hp}/${s.p2hp} | log ${s.logLen} | q ${s.queueLen}`)
      }
    } else if (Date.now() - lastProgressAt > STALL_MS) {
      console.error('\n🛑 STALL DETECTED. Last snapshot:')
      console.error(JSON.stringify(s, null, 2))
      console.error('Recent history:', JSON.stringify(history.slice(-6), null, 2))
      await page.screenshot({ path: `playtest-stall-m${matchIdx}.png` })
      return { ok: false, stall: s }
    }

    // While a cinematic is resolving, just wait.
    if (s.currentRes) {
      await page.waitForTimeout(250)
      continue
    }

    const isViewerTurn = s.activePlayer === s.viewerId

    // Recovery: close an inspection modal we didn't mean to open (row
    // mis-clicks land here) so the action bar stays reachable.
    if (s.overlay === 'ability' || s.overlay === 'card') {
      const closed = await clickButton(page, 'Cancel') || await clickButton(page, 'Close')
      if (!closed) {
        await page.evaluate(() => window.__poh.ui.getState().setOverlay('none'))
      }
      await page.waitForTimeout(150)
      continue
    }

    // Viewer-directed prompts take precedence.
    if (s.pendingAttack && s.pendingAttack.defender === s.viewerId) {
      // Pick the first defense option (row inside the Incoming overlay),
      // then confirm — or brace when the attack is undefendable.
      const overlay = page.locator('[data-overlay="defensive"]')
      const opt = overlay.getByRole('button').first()
      if (await opt.isVisible().catch(() => false)) await opt.click().catch(() => {})
      await page.waitForTimeout(150)
      const confirmed =
        await clickBar(page, 'Confirm Defense')
        || await clickBar(page, 'Brace for Impact')
        || await clickBar(page, 'Take Hit')
      if (!confirmed) log('  ⚠ no defense confirm button found')
      await page.waitForTimeout(200)
      continue
    }
    if (s.pendingBankSpend && s.pendingBankSpend.holder === s.viewerId) {
      if (!(await clickBar(page, 'Confirm Spend'))) await clickBar(page, 'Skip Spend')
      await page.waitForTimeout(200)
      continue
    }
    if (s.pendingOffensiveChoice && s.pendingOffensiveChoice.attacker === s.viewerId) {
      // Two-step prompt scoped to the picker overlay: tap the first
      // ability row, then its Fire button.
      const prompt = page.locator('[data-overlay="offensive-pick"]')
      const row = prompt.getByRole('button').filter({ hasText: /T\d/ }).first()
      if (await row.isVisible().catch(() => false)) {
        await row.click().catch(() => {})
        await page.waitForTimeout(150)
        await prompt.getByRole('button', { name: 'Fire' }).click({ timeout: 2000 }).catch(() => {})
      }
      await page.waitForTimeout(300)
      continue
    }

    if (!isViewerTurn) {
      // AI's move — do nothing; stall detector will catch a dead AI.
      await page.waitForTimeout(300)
      continue
    }

    // Viewer's turn, no prompt: act by phase.
    if (s.phase === 'main-pre') {
      await clickBar(page, 'Roll')
    } else if (s.phase === 'offensive-roll') {
      // Reroll once if we still have 2+ attempts, else commit.
      if (s.rolls >= 2 && Math.random() < 0.5) await clickBar(page, 'Reroll')
      else await clickBar(page, 'Fire')
    } else if (s.phase === 'main-post') {
      await clickBar(page, 'End Turn')
    } else {
      // upkeep/income/defensive-roll auto-advance — wait.
    }
    await page.waitForTimeout(250)
  }

  return { ok: false, reason: 'max-steps' }
}

async function main() {
  const browser = await chromium.launch({
    headless: !HEADED,
    executablePath: EXEC,
  })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      const text = msg.text()
      if (text.includes('Download the React DevTools')) return
      console.error(`  [console.${msg.type()}]`, text.slice(0, 300))
    }
  })
  page.on('pageerror', (err) => console.error('  [pageerror]', String(err).slice(0, 500)))

  let failures = 0
  for (let m = 0; m < MATCHES; m++) {
    const result = await playMatch(page, m)
    if (!result.ok) {
      failures++
      console.error(`❌ match ${m + 1} FAILED:`, JSON.stringify(result).slice(0, 400))
    } else {
      log(`✔ match ${m + 1} completed in ${result.turns} turns`)
    }
  }

  await browser.close()
  if (failures > 0) {
    console.error(`\n${failures}/${MATCHES} matches failed`)
    process.exit(1)
  }
  log(`\nAll ${MATCHES} matches completed cleanly 🎉`)
}

main().catch((err) => { console.error(err); process.exit(1) })
