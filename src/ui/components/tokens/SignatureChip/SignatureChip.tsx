/**
 * <SignatureChip>
 *
 * Circular 22×22 chip for frostbite / cinder / verdict with corner
 * count badge. Cinder gets a fuse-ring driven by --fuse custom prop.
 *
 * Bible reference: Part 4.1.
 */

import type { CSSProperties } from 'react'
import { clsx } from '@/ui/util/clsx'
import type { SignatureKind } from '@/ui/types/status'
import { Icon } from '@/ui/components/atoms/Icon'
import type { IconName } from '@/ui/types/icon'
import s from './SignatureChip.module.css'

export interface SignatureChipProps {
  kind:         SignatureKind
  count:        number
  threshold?:   boolean
  isApplying?:  boolean
  isConsuming?: boolean
  isDetonating?: boolean
  className?:   string
}

const ICON_BY_KIND: Record<SignatureKind, IconName> = {
  frostbite: 'snowflake',
  cinder:    'flame',
  verdict:   'sparkles',
}

export function SignatureChip({
  kind,
  count,
  threshold,
  isApplying,
  isConsuming,
  isDetonating,
  className,
}: SignatureChipProps): JSX.Element {
  const fusePct = Math.min(100, (count / 6) * 100)
  const style: CSSProperties = { ['--fuse' as string]: `${fusePct}` }
  return (
    <span
      className={clsx(
        s.chip,
        s[kind],
        threshold && s.threshold,
        isApplying && s.applying,
        isConsuming && s.consuming,
        isDetonating && s.detonating,
        className,
      )}
      style={style}
      aria-label={`${kind} ${count}`}
    >
      {kind === 'cinder' ? <span className={s.fuseRing} /> : null}
      <Icon name={ICON_BY_KIND[kind]} size={13} />
      {count > 0 ? <span className={s.badge}>{count}</span> : null}
    </span>
  )
}

export default SignatureChip
