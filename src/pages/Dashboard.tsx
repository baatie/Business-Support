import { useEffect, useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MOCK_INVOICES, MOCK_EXPENSES } from '../lib/mockData'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, CheckCircle, Percent } from 'lucide-react'
import { generateInsights } from '../lib/insights'
import type { Insight } from '../lib/insights'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
    const { activeBusiness } = useBusiness()
    const { isDemo } = useAuth()
    const [invoices, setInvoices] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [insights, setInsights] = useState<Insight[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            if (!activeBusiness) return
            setLoading(true)

            if (isDemo) {
                setInvoices(MOCK_INVOICES)
                setExpenses(MOCK_EXPENSES)
                setInsights(generateInsights(MOCK_INVOICES, MOCK_EXPENSES, activeBusiness))
                setLoading(false)
                return
            }

            const { data: invData } = await supabase
                .from('invoices')
                .select('*')
                .eq('business_id', activeBusiness.id)

            const { data: expData } = await supabase
                .from('expenses')
                .select('*')
                .eq('business_id', activeBusiness.id)

            setInvoices(invData || [])
            setExpenses(expData || [])

            const generated = generateInsights(invData || [], expData || [], activeBusiness)
            setInsights(generated)

            setLoading(false)
        }

        fetchData()
    }, [activeBusiness, isDemo])

    // Calculations
    const totalRevenue = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.total_amount, 0)

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    const accountsReceivable = invoices
        .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
        .reduce((sum, i) => sum + i.total_amount, 0)

    const profit = totalRevenue - totalExpenses

    const totalBilled = totalRevenue + accountsReceivable
    const yieldPercentage = totalBilled > 0 ? (totalRevenue / totalBilled) * 100 : 0

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD' }).format(amount)
    }

    const handleInsightAction = (action: string) => {
        switch (action) {
            case 'Review AR':
                navigate('/invoices')
                break
            case 'View Expenses':
                navigate('/expenses')
                break
            case 'Edit Terms':
                navigate('/invoices')
                break
            default:
                console.log('Unknown action:', action)
        }
    }

    if (loading) return <div className="p-8 text-center text-[var(--color-primary)]">Loading Dashboard...</div>

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in text-[var(--color-primary)]">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-[var(--color-secondary)] mb-8">Overview for {activeBusiness?.name}</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card bg-white/60 p-6 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-[var(--color-secondary)]">Revenue</h3>
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>

                <div className="card bg-white/60 p-6 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-[var(--color-secondary)]">Expenses</h3>
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                </div>

                <div className="card bg-white/60 p-6 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-[var(--color-secondary)]">Profit</h3>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)}
                    </p>
                </div>

                <div className="card bg-white/60 p-6 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-[var(--color-secondary)]">Receivable</h3>
                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(accountsReceivable)}</p>
                </div>

                <div className="card bg-white/60 p-6 flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-[var(--color-secondary)]">Invoice Yield</h3>
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Percent size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{yieldPercentage.toFixed(1)}%</p>
                </div>
            </div>

            {/* AI Strategy & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Recent Activity or Chart could go here */}
                    <div className="card p-6">
                        <h3 className="text-xl font-bold mb-4">Financial Health</h3>
                        <div className="h-48 flex items-center justify-center border-2 border-dashed border-[var(--color-secondary)]/30 rounded-lg text-[var(--color-secondary)]">
                            Chart Placeholder (Coming Soon)
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold">AI Strategy & Insights</h3>
                    {insights.map((insight, index) => (
                        <div key={index} className="card p-4 border-l-4 overflow-hidden relative"
                            style={{
                                borderLeftColor: insight.type === 'warning' ? '#EF4444' : insight.type === 'suggestion' ? '#3B82F6' : '#10B981'
                            }}
                        >
                            <div className="flex gap-3">
                                <div className={`mt-1 flex-shrink-0 ${insight.type === 'warning' ? 'text-red-500' : insight.type === 'suggestion' ? 'text-blue-500' : 'text-green-500'
                                    }`}>
                                    {insight.type === 'warning' ? <AlertTriangle size={20} /> :
                                        insight.type === 'suggestion' ? <Lightbulb size={20} /> : <CheckCircle size={20} />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{insight.message}</p>
                                    {insight.action && (
                                        <button
                                            onClick={() => handleInsightAction(insight.action!)}
                                            className="text-xs font-bold uppercase mt-2 hover:underline opacity-80"
                                        >
                                            {insight.action} →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {insights.length === 0 && (
                        <div className="p-4 text-center opacity-60 italic">No insights available yet. Add more data</div>
                    )}
                </div>
            </div>
        </div>
    )
}
