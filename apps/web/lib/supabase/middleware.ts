import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh the session token
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to onboarding
  const { pathname } = request.nextUrl
  const isOnboarding = pathname.startsWith('/onboarding')
  const isPublic = pathname.startsWith('/_next') || pathname.startsWith('/api')

  if (!user && !isOnboarding && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Don't redirect authenticated users away from onboarding —
  // they may not have a profile yet. The onboarding page handles its own flow.

  return supabaseResponse
}
