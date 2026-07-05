/**
 * <ConsumedToken>
 *
 * 24×24 chip used in FOP ConsumeContent / DetonationContent scenes.
 * Frostbite/verdict variants get a strikethrough; cinder gets burst lines.
 *
 * Bible reference: Parts 5.6 + 5.7.
 */

import { clsx } from '@/ui/util/clsx'
import { Icon } from '@/ui/components/atoms/Icon'
import type { IconName } from '@/ui/types/icon'
import s from './ConsumedToken.module.css'

export type ConsumedKind = 'frostbite' | 'cinder' | 'verdict'

export interface ConsumedTokenProps {
  kind:      ConsumedKind
  burst?:    boolean
  className?: string
}

const ICON: Record<ConsumedKind, IconName> = {
  frostbite: 'snowflake',
  cinder:    'flame',
  verdict:   'sparkles',
}

export function ConsumedToken({
  kind,
  burst,
  className,
}: ConsumedTokenProps): JSX.Element {
  return (
    <span className={clsx(s.token, s[kind], burst && s.burst, className)}>
      <Icon name={ICON[kind]} size={14} />
      {kind !== 'cinder' ? <span className={s.strike} aria-hidden="true" /> : null}
    </span>
  )
}

export default ConsumedToken
