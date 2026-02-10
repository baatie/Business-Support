import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { MOCK_USER } from '../lib/mockData'

const DEMO_KEY = 'business_support_is_demo'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    isDemo: boolean
    startDemo: () => void
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    isDemo: false,
    startDemo: () => { },
    signOut: async () => { },
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [isDemo, setIsDemo] = useState(false)

    useEffect(() => {
        // Check for demo mode in local storage
        const storedDemo = localStorage.getItem(DEMO_KEY) === 'true'
        if (storedDemo) {
            setIsDemo(true)
            // @ts-ignore
            setUser(MOCK_USER as any)
            setSession({ user: MOCK_USER } as any)
            setLoading(false)
            return
        }

        // Check active sessions and sets the user
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (storedDemo) return
                setSession(session)
                setUser(session?.user ?? null)
            } catch (error) {
                console.error('Auth initialization failed:', error)
            } finally {
                setLoading(false)
            }
        }

        initAuth()

        // Listen for changes on auth state (sing in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (storedDemo) return
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        if (isDemo) {
            setIsDemo(false)
            setUser(null)
            setSession(null)
            localStorage.removeItem(DEMO_KEY)
            localStorage.removeItem('activeBusinessId')
            window.location.href = '/'
        } else {
            await supabase.auth.signOut()
        }
    }

    const startDemo = () => {
        setIsDemo(true)
        localStorage.setItem(DEMO_KEY, 'true')
        // @ts-ignore - Mocking partial user object for demo
        setUser(MOCK_USER as any)
        setSession({ user: MOCK_USER } as any)

        // Force navigation to dashboard
        window.location.href = '/'
    }

    const value = {
        user,
        session,
        loading,
        isDemo,
        startDemo,
        signOut,
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
