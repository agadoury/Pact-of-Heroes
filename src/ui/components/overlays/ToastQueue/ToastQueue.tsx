/**
 * <ToastQueue>
 *
 * Top-anchored transient notifications. Non-blocking.
 *
 * Bible reference: Part 6.5.
 */

import { useEffect } from 'react'
import { create } from 'zustand'
import { clsx } from '@/ui/util/clsx'
import { DURATION } from '@/ui/util/duration'
import s from './ToastQueue.module.css'

export type ToastKind = 'info' | 'warn' | 'error' | 'success'

export interface Toast {
  id:         string
  kind:       ToastKind
  message:    string
  durationMs: number
}

interface ToastStore {
  toasts:  Toast[]
  push:    (t: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => void
  dismiss: (id: string) => void
}

let seq = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => set((state) => ({
    toasts: [
      ...state.toasts,
      {
        id:         `toast-${++seq}`,
        kind:       t.kind,
        message:    t.message,
        durationMs: t.durationMs ?? DURATION.toastDefault,
      },
    ],
  })),
  dismiss: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
}))

export function toast(kind: ToastKind, message: string, durationMs?: number): void {
  useToastStore.getState().push({ kind, message, durationMs })
}

export function ToastQueue(): JSX.Element {
  const toasts  = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map(t =>
      window.setTimeout(() => dismiss(t.id), t.durationMs),
    )
    return () => { for (const id of timers) window.clearTimeout(id) }
  }, [toasts, dismiss])

  return (
    <div className={s.queue} aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          className={clsx(s.toast, s[t.kind])}
          onClick={() => dismiss(t.id)}
          role="alert"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default ToastQueue
