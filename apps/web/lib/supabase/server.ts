// Server-side Supabase client (for Server Components and Route Handlers)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const createClient = cache(async () => {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
          }
        },
      },
    },
  )

  const original = client.auth.getUser.bind(client.auth)
  let pending: ReturnType<typeof original> | null = null
  client.auth.getUser = ((jwt?: string) => {
    if (jwt) return original(jwt)
    if (!pending) pending = original()
    return pending
  }) as typeof client.auth.getUser

  return client
})
