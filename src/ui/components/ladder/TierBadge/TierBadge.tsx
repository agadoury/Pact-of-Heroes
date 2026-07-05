/**
 * <TierBadge>
 *
 * Retained for HeroDetailScreen ability listings only. Not used in the
 * active offensive ladder or defensive picker.
 *
 * Bible reference: Part 3.3.1.
 */

import { clsx } from '@/ui/util/clsx'
import s from './TierBadge.module.css'

export type TierBadgeVariant = 'default' | 'lethal'

export interface TierBadgeProps {
  tier:      1 | 2 | 3 | 4 | 'D1' | 'D2'
  variant?:  TierBadgeVariant
  className?: string
}

export function TierBadge({
  tier,
  variant = 'default',
  className,
}: TierBadgeProps): JSX.Element {
  const isDefensive = tier === 'D1' || tier === 'D2'
  return (
    <span
      className={clsx(
        s.badge,
        isDefensive ? s.defensive : s.offensive,
        s[`variant-${variant}`],
        className,
      )}
    >
      {typeof tier === 'number' ? `T${tier}` : tier}
    </span>
  )
}

export default TierBadge
