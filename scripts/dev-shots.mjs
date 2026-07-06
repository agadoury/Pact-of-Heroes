import { chromium } from 'playwright-core'

const OUT = '/tmp/claude-0/-home-user-Pact-of-Heroes/77ad11ec-8597-53bd-aa25-8a07c4a7eedc/scratchpad/shots'
const BASE = 'http://localhost:5173'

const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` })

await page.goto(BASE + '/')
await page.waitForTimeout(1200)
await shot('01-home')

await page.goto(BASE + '/heroes')
await page.waitForTimeout(800)
await shot('02-hero-select')

// Start a match
await page.getByRole('button', { name: 'Begin Match' }).click()
await page.waitForFunction(() => !!window.__poh?.game.getState().state)
await page.waitForTimeout(600)
await shot('03-match-intro')
// skip intro
await page.locator('div').filter({ hasText: /tap to skip/ }).last().click({ force: true }).catch(() => {})
await page.waitForTimeout(800)
await shot('04-match-mainpre')

// Roll
const bar = page.locator('[data-band="action-bar"]')
await bar.getByRole('button', { name: 'Roll' }).first().click().catch(() => {})
await page.waitForTimeout(900)
await shot('05-match-rolled')

// Open ability modal
await page.locator('[data-band="middle"]').getByRole('button').first().click().catch(() => {})
await page.waitForTimeout(400)
await shot('06-ability-view')
await page.evaluate(() => window.__poh.ui.getState().setOverlay('none'))

// Open a card
await page.locator('[data-band="hand"]').getByRole('button').first().click().catch(() => {})
await page.waitForTimeout(400)
await shot('07-card-view')
await page.evaluate(() => window.__poh.ui.getState().setOverlay('none'))

// Fire and wait for a resolution scene / defense
await bar.getByRole('button', { name: 'Fire' }).first().click().catch(() => {})
await page.waitForTimeout(1000)
await shot('08-after-fire')
await page.waitForTimeout(2500)
await shot('09-resolution')

// Let AI take its turn, catch defense overlay when it attacks us
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(500)
  const s = await page.evaluate(() => {
    const g = window.__poh.game.getState()
    return {
      pa: g.state?.pendingAttack?.defender ?? null,
      res: window.__poh.ui.getState().currentResolution?.scene?.kind ?? null,
      phase: g.state?.phase,
      active: g.state?.activePlayer,
    }
  })
  if (s.res === 'ability') { await shot('10-fop-ability'); }
  if (s.pa === 'p1') { await shot('11-defense-overlay'); break }
  if (s.phase === 'main-pre' && s.active === 'p1') break
}

await shot('12-current')

await browser.close()
console.log('done')
