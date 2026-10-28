'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type Kind = 'success' | 'info' | 'error'

interface ToastItem {
  id: number
  message: string
  kind: Kind
}

interface ToastApi {
  show: (message: string, kind?: Kind) => void
}

const ToastContext = createContext<ToastApi>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const KIND_CLASSES: Record<Kind, string> = {
  success: 'bg-emerald-700 text-white',
  info: 'bg-blue-600 text-white',
  error: 'bg-red-600 text-white',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const timers = useRef<number[]>([])

  const show = useCallback((message: string, kind: Kind = 'info') => {
    counter.current += 1
    const id = counter.current
    setItems((prev) => [...prev.slice(-2), { id, message, kind }])
    const timer = window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
    timers.current.push(timer)
  }, [])

  useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4"
        style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${KIND_CLASSES[t.kind]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
