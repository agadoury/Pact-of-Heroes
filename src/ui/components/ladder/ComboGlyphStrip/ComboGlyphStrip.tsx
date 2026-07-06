/**
 * <ComboGlyphStrip>
 *
 * The horizontal pip strip on every ladder row. Renders one Pip per
 * required slot with the correct glyph (sigil first-char or number).
 *
 * Bible reference: Part 3.4.
 */

import { clsx } from '@/ui/util/clsx'
import { Pip, type PipSize } from '@/ui/components/atoms/Pip'
import { Sigil } from '@/ui/components/atoms/Sigil'
import type { ComboDescriptor, ComboState } from '@/ui/types/ability'
import s from './ComboGlyphStrip.module.css'

export interface ComboGlyphStripProps {
  descriptor: ComboDescriptor
  state:      ComboState
  size?:      PipSize
  variant?:   'offensive' | 'defensive'
  className?: string
}

export function ComboGlyphStrip({
  descriptor,
  state,
  size = 'default',
  variant = 'offensive',
  className,
}: ComboGlyphStripProps): JSX.Element {
  const glyphs = glyphsFor(descriptor, size === 'prominent' ? 13 : 10)
  return (
    <div className={clsx(s.strip, size === 'prominent' && s.prominent, className)}>
      {state.pips.map((pipState, i) => (
        <Pip key={i} state={pipState} size={size} variant={variant}>
          {glyphs[i]}
        </Pip>
      ))}
    </div>
  )
}

function glyphsFor(desc: ComboDescriptor, sigilSize: number): (string | number | JSX.Element)[] {
  switch (desc.kind) {
    case 'sigil':
      return desc.symbols.map((sym, i) => <Sigil key={i} symbol={sym} size={sigilSize} />)
    case 'straight':
      return desc.numbers
    case 'n-of-a-kind':
      return Array.from({ length: desc.count }, () => '×')
    case 'compound':
      return desc.clauses.flatMap(c => glyphsFor(c, sigilSize))
  }
}

export default ComboGlyphStrip
