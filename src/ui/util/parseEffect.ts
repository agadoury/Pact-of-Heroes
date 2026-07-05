/**
 * parseEffectText — engine `Card.text` → UI `EffectSegment[]`.
 *
 * Takes plain prose like `"Deal 4 unblockable damage and apply Sanctuary."`
 * and produces a segmented view for the renderer:
 *
 *   [
 *     { kind: 'text',    content: 'Deal ' },
 *     { kind: 'value',   content: '4' },
 *     { kind: 'text',    content: ' ' },
 *     { kind: 'keyword', id: 'undefendable' },
 *     { kind: 'text',    content: ' damage and apply ' },
 *     { kind: 'keyword', id: 'sanctuary' },
 *     { kind: 'text',    content: '.' },
 *   ]
 *
 * Algorithm:
 *   1. Build a token-scan pass identifying keyword spans (longest match
 *      first) and numeric spans (contiguous digits).
 *   2. Walk the string left-to-right, emitting text runs for uncovered
 *      slices and value / keyword segments for identified spans.
 *
 * Whitespace is preserved verbatim. The parser is idempotent: running it
 * twice on the same input produces the same segment array.
 *
 * Bible reference: Part 1.9.
 */

import { KEYWORD_REGISTRY, type EffectSegment } from '@/ui/types/card'

interface Span {
  start: number
  end: number
  segment: EffectSegment
}

/** Build a stable sort key so a longer keyword wins over a substring match. */
function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end
}

/** Find every numeric run in the string. */
function findValueSpans(text: string): Span[] {
  const spans: Span[] = []
  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const re = /\d+/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    spans.push({
      start:   match.index,
      end:     match.index + match[0].length,
      segment: { kind: 'value', content: match[0] },
    })
  }
  return spans
}

/**
 * Find every keyword span. Uses each keyword's `matchText` array; longer
 * match strings win when they overlap.
 *
 * The scan is case-sensitive against `matchText` (which registers common
 * capitalization variants explicitly — see `KEYWORD_REGISTRY`), and
 * word-boundary-aware so `"Sun"` inside `"Sunrise"` doesn't match.
 */
function findKeywordSpans(text: string): Span[] {
  const spans: Span[] = []
  for (const kw of Object.values(KEYWORD_REGISTRY)) {
    for (const raw of kw.matchText) {
      let idx = 0
      while ((idx = text.indexOf(raw, idx)) !== -1) {
        const end = idx + raw.length
        // Word boundary: neither side may be a letter or digit.
        const before = idx > 0             ? text[idx - 1]! : ' '
        const after  = end < text.length   ? text[end]!    : ' '
        const isWordChar = (c: string) => /[A-Za-z0-9]/.test(c)
        if (!isWordChar(before) && !isWordChar(after)) {
          spans.push({
            start:   idx,
            end,
            segment: { kind: 'keyword', id: kw.id },
          })
        }
        idx = end
      }
    }
  }
  // Prefer longer spans over shorter overlapping ones — "unblockable" (11) beats "ub" (2).
  spans.sort((a, b) => (b.end - b.start) - (a.end - a.start))
  return spans
}

/**
 * Merge value and keyword spans, resolving overlaps by:
 *   1. keyword > value (a keyword like "3" is unlikely, but if a keyword's
 *      match text starts with a digit it should still win)
 *   2. longer span > shorter span (already sorted for keywords)
 */
function mergeSpans(valueSpans: Span[], keywordSpans: Span[]): Span[] {
  const chosen: Span[] = []

  // First, admit keyword spans in longest-first order, rejecting overlaps.
  for (const span of keywordSpans) {
    if (chosen.some(existing => overlaps(existing, span))) continue
    chosen.push(span)
  }

  // Then, admit value spans that don't overlap any already-admitted keyword.
  for (const span of valueSpans) {
    if (chosen.some(existing => overlaps(existing, span))) continue
    chosen.push(span)
  }

  return chosen.sort((a, b) => a.start - b.start)
}

/**
 * Public entrypoint. Returns an array of segments covering the entire
 * input string (i.e. concatenating all `content` values reproduces the
 * original prose exactly).
 */
export function parseEffectText(text: string): EffectSegment[] {
  if (!text) return []

  const spans = mergeSpans(findValueSpans(text), findKeywordSpans(text))

  const segments: EffectSegment[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.start > cursor) {
      segments.push({ kind: 'text', content: text.slice(cursor, span.start) })
    }
    segments.push(span.segment)
    cursor = span.end
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', content: text.slice(cursor) })
  }
  return mergeAdjacentText(segments)
}

/**
 * Post-process: collapse consecutive `text` segments. This can happen when
 * two spans sit exactly adjacent (no separator text between them) — the
 * emit-text-in-between step produces an empty text segment, which we drop.
 */
function mergeAdjacentText(segments: EffectSegment[]): EffectSegment[] {
  const out: EffectSegment[] = []
  for (const seg of segments) {
    if (seg.kind === 'text') {
      if (seg.content.length === 0) continue
      const last = out[out.length - 1]
      if (last && last.kind === 'text') {
        out[out.length - 1] = { kind: 'text', content: last.content + seg.content }
        continue
      }
    }
    out.push(seg)
  }
  return out
}

/**
 * Truncate a segment list to approximate `maxChars` of rendered length,
 * preserving keyword segments intact and appending an ellipsis if truncated.
 * Used by HandCard when no `effectCompact` was authored.
 */
export function truncateSegments(segments: EffectSegment[], maxChars: number): EffectSegment[] {
  let used = 0
  const out: EffectSegment[] = []
  for (const seg of segments) {
    const len =
      seg.kind === 'text' || seg.kind === 'value' ? seg.content.length :
      /* keyword */         (KEYWORD_REGISTRY[seg.id]?.displayLabel.length ?? seg.id.length)

    if (used + len > maxChars) {
      // Text-segment mid-truncation is fine; keyword/value segments are all-or-nothing.
      if (seg.kind === 'text') {
        const remaining = maxChars - used
        if (remaining > 3) {
          out.push({ kind: 'text', content: seg.content.slice(0, remaining - 1).trimEnd() + '…' })
        } else if (out.length > 0) {
          const last = out[out.length - 1]!
          if (last.kind === 'text') {
            out[out.length - 1] = { kind: 'text', content: last.content.trimEnd() + '…' }
          } else {
            out.push({ kind: 'text', content: '…' })
          }
        }
      } else if (out.length > 0) {
        const last = out[out.length - 1]!
        if (last.kind === 'text') {
          out[out.length - 1] = { kind: 'text', content: last.content.trimEnd() + '…' }
        } else {
          out.push({ kind: 'text', content: '…' })
        }
      }
      break
    }

    out.push(seg)
    used += len
  }
  return out
}
