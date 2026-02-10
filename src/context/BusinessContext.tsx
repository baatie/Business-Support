import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { MOCK_BUSINESS } from '../lib/mockData'

export interface Business {
    id: string
    name: string
    currency: string
    theme_preference: 'oak' | 'purple_heart' | 'maple' | 'bates_mix'
    owner_id: string
    address?: string
    phone?: string
    net_pay_schedule?: string
}

interface BusinessContextType {
    businesses: Business[]
    activeBusiness: Business | null
    loading: boolean
    createBusiness: (name: string, theme: Business['theme_preference']) => Promise<void>
    updateBusiness: (id: string, updates: Partial<Business>) => Promise<void>
    switchBusiness: (businessId: string) => void
    refreshBusinesses: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType | null>(null)

export const useBusiness = () => {
    const context = useContext(BusinessContext)
    if (!context) {
        throw new Error('useBusiness must be used within a BusinessProvider')
    }
    return context
}

export const BusinessProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isDemo } = useAuth()
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [activeBusiness, setActiveBusiness] = useState<Business | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchBusinesses = async () => {
        if (!user) return
        setLoading(true)

        if (isDemo) {
            setBusinesses([MOCK_BUSINESS])
            setActiveBusiness(MOCK_BUSINESS)
            setLoading(false)
            return
        }

        // Fetch businesses where user is owner or member
        // Using simple query for now, might need join with members table later if RLS is strict
        // But our RLS allows select if member exists.
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching businesses:', error)
        } else {
            setBusinesses(data || [])
            // Set active business if none selected or if previously selected is not in list
            if (data && data.length > 0) {
                // Try to recover from local storage
                const savedId = localStorage.getItem('activeBusinessId')
                const found = data.find(b => b.id === savedId)
                setActiveBusiness(found || data[0])
            } else {
                setActiveBusiness(null)
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        if (user) {
            fetchBusinesses()
        } else {
            setBusinesses([])
            setActiveBusiness(null)
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        // Apply theme when active business changes
        if (activeBusiness) {
            document.documentElement.setAttribute('data-theme', activeBusiness.theme_preference)
            localStorage.setItem('activeBusinessId', activeBusiness.id)
        } else {
            document.documentElement.removeAttribute('data-theme')
            localStorage.removeItem('activeBusinessId')
        }
    }, [activeBusiness])

    const createBusiness = async (name: string, theme: Business['theme_preference']) => {
        if (!user) return

        if (isDemo) {
            const mockNewBusiness: Business = {
                id: `mock-business-${Date.now()}`,
                name,
                currency: 'USD',
                theme_preference: theme,
                owner_id: user.id || 'mock-user-id',
                address: '',
                phone: '',
                net_pay_schedule: ''
            }
            setBusinesses([mockNewBusiness, ...businesses])
            setActiveBusiness(mockNewBusiness)
            return
        }

        const { data, error } = await supabase
            .from('businesses')
            .insert([
                {
                    name,
                    theme_preference: theme,
                    owner_id: user.id
                }
            ])
            .select()
            .single()

        if (error) throw error

        setBusinesses([data, ...businesses])
        setActiveBusiness(data)
    }

    const updateBusiness = async (id: string, updates: Partial<Business>) => {
        if (!user) return

        if (!isDemo) {
            const { error } = await supabase
                .from('businesses')
                .update(updates)
                .eq('id', id)

            if (error) throw error
        }

        const updatedBusinesses = businesses.map(b => b.id === id ? { ...b, ...updates } : b)
        setBusinesses(updatedBusinesses)
        if (activeBusiness?.id === id) {
            setActiveBusiness({ ...activeBusiness, ...updates })
        }
    }

    const switchBusiness = (businessId: string) => {
        const found = businesses.find(b => b.id === businessId)
        if (found) {
            setActiveBusiness(found)
        }
    }

    return (
        <BusinessContext.Provider value={{
            businesses,
            activeBusiness,
            loading,
            createBusiness,
            updateBusiness,
            switchBusiness,
            refreshBusinesses: fetchBusinesses
        }}>            {children}
        </BusinessContext.Provider>
    )
}
