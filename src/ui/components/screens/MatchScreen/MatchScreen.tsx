/**
 * <MatchScreen> (skeleton)
 *
 * The route-level match screen. This ticket lands only the seven-band
 * layout with placeholder content — every band is a stub that becomes a
 * real component in M2 onward.
 *
 * Bible reference: Part 2 (bands hierarchy).
 */

import { ScreenBands } from '@/ui/components/shared/ScreenBands'
import s from './MatchScreen.module.css'

export function MatchScreen(): JSX.Element {
  return (
    <ScreenBands>
      <div className={s.band} data-band="opp-strip">
        <span className={s.stub}>OpponentStrip — 13%</span>
      </div>
      <div className={s.band} data-band="phase-banner">
        <span className={s.stub}>PhaseBanner — 3.5%</span>
      </div>
      <div className={s.band} data-band="dice-tray">
        <span className={s.stub}>DiceTray — 13%</span>
      </div>
      <div className={s.band} data-band="middle">
        <span className={s.stub}>MiddleBand · AbilityLadder / FOP — 28%</span>
      </div>
      <div className={s.band} data-band="self-strip">
        <span className={s.stub}>SelfStrip — 12%</span>
      </div>
      <div className={s.band} data-band="hand">
        <span className={s.stub}>Hand — 20%</span>
      </div>
      <div className={s.band} data-band="action-bar">
        <span className={s.stub}>ActionBar — 7.5%</span>
      </div>
    </ScreenBands>
  )
}

export default MatchScreen
