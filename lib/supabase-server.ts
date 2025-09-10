import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cache the cookie store to avoid repeated await calls
let cachedCookieStore: any = null;

export async function createServerSupabaseClient() {
  // Cache the cookie store for better performance
  if (!cachedCookieStore) {
    cachedCookieStore = await cookies();
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cachedCookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cachedCookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
