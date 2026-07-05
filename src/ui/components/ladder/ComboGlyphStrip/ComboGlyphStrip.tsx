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
  const glyphs = glyphsFor(descriptor)
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

function glyphsFor(desc: ComboDescriptor): (string | number)[] {
  switch (desc.kind) {
    case 'sigil':
      return desc.symbols.map(sym => symbolGlyph(sym))
    case 'straight':
      return desc.numbers
    case 'n-of-a-kind':
      return Array.from({ length: desc.count }, () => '×')
    case 'compound':
      return desc.clauses.flatMap(c => glyphsFor(c))
  }
}

function symbolGlyph(symbol: string): string {
  // Take first char after the namespace as a short-form glyph.
  const bare = symbol.includes(':') ? symbol.split(':').pop()! : symbol
  return bare.charAt(0).toUpperCase()
}

export default ComboGlyphStrip
