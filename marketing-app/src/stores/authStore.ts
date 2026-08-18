import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentUser, signIn, signUp, signOut, onAuthStateChange } from '../lib/supabase/auth'

interface User {
  id: string
  email: string
  role?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await signIn(email, password)
          if (error) throw error
          if (data.user) {
            set({ 
              user: { 
                id: data.user.id, 
                email: data.user.email || '',
                role: data.user.user_metadata?.role 
              } 
            })
          }
        } catch (error: any) {
          set({ error: error.message || 'Login failed' })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      register: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await signUp(email, password)
          if (error) throw error
          if (data.user) {
            set({ 
              user: { 
                id: data.user.id, 
                email: data.user.email || '',
                role: data.user.user_metadata?.role 
              } 
            })
          }
        } catch (error: any) {
          set({ error: error.message || 'Registration failed' })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      logout: async () => {
        set({ isLoading: true, error: null })
        try {
          const { error } = await signOut()
          if (error) throw error
          set({ user: null })
        } catch (error: any) {
          set({ error: error.message || 'Logout failed' })
        } finally {
          set({ isLoading: false })
        }
      },
      
      checkAuth: async () => {
        set({ isLoading: true, error: null })
        try {
          const { user, error } = await getCurrentUser()
          if (error) throw error
          if (user) {
            set({ 
              user: { 
                id: user.id, 
                email: user.email || '',
                role: user.user_metadata?.role 
              } 
            })
          } else {
            set({ user: null })
          }
        } catch (error: any) {
          set({ error: error.message || 'Auth check failed', user: null })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// Set up auth state change listener
let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null

export const initializeAuthListener = () => {
  if (authListener) return
  
  authListener = onAuthStateChange((_event, session) => {
    const { setUser } = useAuthStore.getState()
    
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.user_metadata?.role
      })
    } else {
      setUser(null)
    }
  })
}

export const cleanupAuthListener = () => {
  if (authListener) {
    authListener.data.subscription.unsubscribe()
    authListener = null
  }
}
