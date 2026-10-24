'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

const POLL_MS = 15000
const SEEN_PENDING = 'loka-seen-pending'
const SEEN_ACCEPTED = 'loka-seen-accepted'

function readSet(key: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return null
  }
}

function writeSet(key: string, value: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(value).slice(-200)))
  } catch {}
}

export default function FriendNotifier() {
  const { show } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const pathRef = useRef(pathname)
  const busy = useRef(false)

  useEffect(() => {
    pathRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function check() {
      if (busy.current || cancelled) return
      busy.current = true
      try {
        const { data: auth } = await supabase.auth.getUser()
        const me = auth.user?.id
        if (!me) return

        let changed = false

        const { data: pending } = await supabase
          .from('friend_requests')
          .select('id')
          .eq('to_user_id', me)
          .eq('status', 'pending')

        const seenPending = readSet(SEEN_PENDING) ?? new Set<string>()
        const freshPending = (pending ?? []).filter((r) => !seenPending.has(r.id as string))
        if (freshPending.length > 0) {
          show(
            freshPending.length === 1
              ? 'You have a new friend request'
              : `You have ${freshPending.length} new friend requests`,
            'info',
          )
          freshPending.forEach((r) => seenPending.add(r.id as string))
          writeSet(SEEN_PENDING, seenPending)
          changed = true
        }

        const { data: accepted } = await supabase
          .from('friend_requests')
          .select('id, to_user_id')
          .eq('from_user_id', me)
          .eq('status', 'accepted')

        const seenAcceptedRaw = readSet(SEEN_ACCEPTED)
        const seenAccepted = seenAcceptedRaw ?? new Set<string>()
        const freshAccepted = (accepted ?? []).filter((r) => !seenAccepted.has(r.id as string))

        if (freshAccepted.length > 0) {
          if (seenAcceptedRaw !== null) {
            const ids = freshAccepted.map((r) => r.to_user_id as string)
            const { data: names } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', ids)
            const nameMap = Object.fromEntries((names ?? []).map((p) => [p.id as string, p.display_name as string]))
            freshAccepted.forEach((r) => {
              const name = nameMap[r.to_user_id as string]
              show(name ? `${name} accepted your friend request` : 'Your friend request was accepted', 'success')
            })
            changed = true
          }
          freshAccepted.forEach((r) => seenAccepted.add(r.id as string))
          writeSet(SEEN_ACCEPTED, seenAccepted)
        } else if (seenAcceptedRaw === null) {
          writeSet(SEEN_ACCEPTED, seenAccepted)
        }

        if (changed && pathRef.current.startsWith('/friends')) {
          router.refresh()
        }
      } catch {
      } finally {
        busy.current = false
      }
    }

    check()
    const timer = window.setInterval(check, POLL_MS)
    function onVisible() {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
    }
  }, [show, router])

  return null
}
