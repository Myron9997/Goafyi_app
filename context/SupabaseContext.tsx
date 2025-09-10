"use client";

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthService, type AuthUser } from '../services/authService'

interface SupabaseContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role?: 'viewer' | 'vendor') => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

export const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: React.ReactNode
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const getCachedAvatarUrl = (userId: string): string | undefined => {
    try {
      const raw = localStorage.getItem(`avatar_url_${userId}`)
      if (!raw) return undefined
      const parsed = JSON.parse(raw)
      const ttlMs = 7 * 24 * 60 * 60 * 1000
      if (!parsed || Date.now() - (parsed.ts || 0) > ttlMs) return undefined
      return parsed.url as string | undefined
    } catch { return undefined }
  }

  const setCachedAvatarUrl = (userId: string, url?: string) => {
    try { if (url) localStorage.setItem(`avatar_url_${userId}`, JSON.stringify({ ts: Date.now(), url })) } catch {}
  }

  const redirectAfterAuth = (profile: AuthUser | null) => {
    if (!profile) return
    const path = window.location.pathname
    const isAuthPage = ['/vendor-login','/viewer-login','/email-confirmation','/'].includes(path)
    
    console.log("SupabaseContext redirectAfterAuth", { role: profile.role, currentPath: path, isAuthPage });
    
    if (profile.role === 'vendor') {
      if (path !== '/account') {
        console.log("SupabaseContext: redirecting vendor to /account");
        window.location.replace('/account')
      }
    } else if (profile.role === 'viewer') {
      if (isAuthPage || path === '/dashboard') {
        console.log("SupabaseContext: redirecting viewer to /home");
        // Use router.push for faster client-side navigation if available
        if (typeof window !== 'undefined' && window.history?.pushState) {
          window.history.pushState(null, '', '/home');
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          window.location.replace('/home')
        }
      }
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Race getSession with a timeout so UI never stalls
        const timeoutMs = 1500
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: any } }>((resolve) => setTimeout(() => resolve({ data: { session: null } }), timeoutMs))
        ]) as { data: { session: any } }
        const { data: { session } } = sessionResult
        if (session?.user) {
          const meta: any = session.user.user_metadata || {}
          const userProfile: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            full_name: meta.full_name,
            avatar_url: getCachedAvatarUrl(session.user.id) || meta.avatar_url,
            phone: meta.phone,
            role: (meta.role as any) || 'viewer',
            created_at: session.user.created_at
          }
          setUser(userProfile)
          redirectAfterAuth(userProfile)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("SupabaseContext onAuthStateChange", event, session?.user?.id);
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("SupabaseContext: SIGNED_IN event, using session metadata");
          const meta: any = session.user.user_metadata || {}
          const userProfile: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            full_name: meta.full_name,
            avatar_url: getCachedAvatarUrl(session.user.id) || meta.avatar_url,
            phone: meta.phone,
            role: (meta.role as any) || 'viewer',
            created_at: session.user.created_at
          }
          setUser(userProfile)
          redirectAfterAuth(userProfile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (session?.user) {
          const meta: any = session.user.user_metadata || {}
          const userProfile: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            full_name: meta.full_name,
            avatar_url: getCachedAvatarUrl(session.user.id) || meta.avatar_url,
            phone: meta.phone,
            role: (meta.role as any) || 'viewer',
            created_at: session.user.created_at
          }
          setUser(userProfile)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error handling auth state change:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string, role: 'viewer' | 'vendor' = 'viewer') => {
    setLoading(true)
    try {
      const result = await AuthService.signUp(email, password, fullName, role)
      return result
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await AuthService.signIn(email, password)
      if (result?.user) {
        setUser(result.user as AuthUser)
        // Ensure immediate redirect after manual sign-in
        redirectAfterAuth(result.user as AuthUser)
      }
      return result
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await AuthService.signOut()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      await AuthService.updateProfile(updates)
      if (user) {
        setUser({ ...user, ...updates })
        if (updates.avatar_url) setCachedAvatarUrl(user.id, updates.avatar_url)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email)
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      await AuthService.updatePassword(newPassword)
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  const value: SupabaseContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}
