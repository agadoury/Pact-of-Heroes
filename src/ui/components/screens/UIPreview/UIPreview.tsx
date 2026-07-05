/**
 * <UIPreview>
 *
 * Dev-only preview route at /ui-preview. Renders the current UI atoms and
 * the MatchScreen skeleton so we can eyeball layout as tickets land.
 *
 * Not shipped in production — the route is registered alongside the
 * legacy /dev/* routes and doesn't appear in navigation.
 */

import { Link } from 'react-router-dom'
import { Button } from '@/ui/components/atoms/Button'
import { Icon } from '@/ui/components/atoms/Icon'
import { Pip } from '@/ui/components/atoms/Pip'
import { ProgressBar } from '@/ui/components/atoms/ProgressBar'
import { StatDivider } from '@/ui/components/atoms/StatDivider'
import { StatLabel } from '@/ui/components/atoms/StatLabel'
import { StatValue } from '@/ui/components/atoms/StatValue'
import { MatchScreen } from '@/ui/components/screens/MatchScreen'
import s from './UIPreview.module.css'

export function UIPreview(): JSX.Element {
  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1>UI Preview</h1>
        <Link to="/" className={s.homeLink}>← back to app</Link>
      </header>

      <section className={s.section}>
        <h2>MatchScreen skeleton</h2>
        <div className={s.phoneFrame}>
          <MatchScreen />
        </div>
      </section>

      <section className={s.section}>
        <h2>Buttons</h2>
        <div className={s.row}>
          <Button variant="default">Default</Button>
          <Button variant="primary" iconRight="chevron-right">Primary</Button>
          <Button variant="crimson">Lethal Strike</Button>
          <Button variant="disabled">Disabled</Button>
          <Button variant="skip">Skip Turn</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className={s.row}>
          <Button variant="default" badge={2}>Reroll</Button>
          <Button variant="primary" badge="!">Confirm</Button>
        </div>
      </section>

      <section className={s.section}>
        <h2>Icons</h2>
        <div className={s.row}>
          <Icon name="shield" size={20} />
          <Icon name="flame" size={20} />
          <Icon name="snowflake" size={20} />
          <Icon name="sparkles" size={20} />
          <Icon name="zap" size={20} />
          <Icon name="heart-pulse" size={20} />
          <Icon name="lock" size={20} />
          <Icon name="chevron-right" size={20} />
          <Icon name="check" size={20} />
          <Icon name="cross" size={20} />
        </div>
      </section>

      <section className={s.section}>
        <h2>Stats</h2>
        <div className={s.row}>
          <StatLabel>HP</StatLabel>
          <StatValue>22</StatValue>
          <StatDivider />
          <StatLabel>CP</StatLabel>
          <StatValue emphasis="resource">8</StatValue>
        </div>
        <div className={s.row}>
          <StatLabel>CP</StatLabel>
          <StatValue emphasis="capped">15</StatValue>
          <span className={s.captionMuted}>capped state</span>
        </div>
        <div className={s.row}>
          <StatLabel>HP</StatLabel>
          <StatValue emphasis="critical">4</StatValue>
          <span className={s.captionMuted}>critical (low HP)</span>
        </div>
      </section>

      <section className={s.section}>
        <h2>HP bar variants</h2>
        <div className={s.stack}>
          <div className={s.row}>
            <StatLabel>HP</StatLabel>
            <StatValue>22</StatValue>
            <ProgressBar value={22} max={30} variant="normal-frost" />
          </div>
          <div className={s.row}>
            <StatLabel>HP</StatLabel>
            <StatValue>18</StatValue>
            <ProgressBar value={18} max={30} variant="normal-ember" />
          </div>
          <div className={s.row}>
            <StatLabel>HP</StatLabel>
            <StatValue emphasis="critical">4</StatValue>
            <ProgressBar value={4} max={30} variant="lethal" />
          </div>
        </div>
      </section>

      <section className={s.section}>
        <h2>Pips (combo strip states)</h2>
        <div className={s.row}>
          <Pip state="outlined" size="prominent">⚔</Pip>
          <Pip state="gold"     size="prominent">⚔</Pip>
          <Pip state="pulse"    size="prominent">⚔</Pip>
        </div>
        <div className={s.row}>
          <Pip state="outlined">1</Pip>
          <Pip state="gold">2</Pip>
          <Pip state="pulse">3</Pip>
          <Pip state="outlined">4</Pip>
        </div>
        <div className={s.row}>
          <Pip state="outlined" variant="defensive">◈</Pip>
          <Pip state="outlined" variant="defensive">◈</Pip>
        </div>
      </section>
    </div>
  )
}

export default UIPreview
