/**
 * Re-export of clsx for a stable import path within the new UI tree.
 *
 * Component modules should `import { clsx } from 'ui/util/clsx'` (via the
 * @/ alias) rather than depending on clsx directly, so a future rename or
 * swap only touches this file.
 */
export { clsx } from 'clsx'
export type { ClassValue } from 'clsx'
