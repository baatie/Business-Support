import { useEffect, useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MOCK_INVOICES, MOCK_EXPENSES } from '../lib/mockData'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, CheckCircle, Percent } from 'lucide-react'
import { generateInsights, generateFinancialHealthData, type Insight, type FinancialHealthData } from '../lib/insights'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
    const { activeBusiness } = useBusiness()
    const { isDemo } = useAuth()
    const [invoices, setInvoices] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [insights, setInsights] = useState<Insight[]>([])
    const [financialHealth, setFinancialHealth] = useState<FinancialHealthData[]>([])
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
                setFinancialHealth(generateFinancialHealthData(MOCK_INVOICES, MOCK_EXPENSES))
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
            setFinancialHealth(generateFinancialHealthData(invData || [], expData || []))

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

    // Chart Scaling
    const maxChartValue = Math.max(...financialHealth.map(d => Math.max(d.revenue, d.expenses))) || 1000

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
                    {/* Financial Health Chart */}
                    <div className="card p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Financial Health</h3>
                            <div className="flex gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div> Revenue
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div> Expenses
                                </div>
                                <div className="flex items-center gap-1 opacity-60">
                                    <div className="w-3 h-3 border border-gray-400 border-dashed rounded-sm"></div> Projected
                                </div>
                            </div>
                        </div>

                        <div className="h-64 flex items-end justify-between gap-2 md:gap-4 pb-2 border-b border-gray-200">
                            {financialHealth.map((item, index) => (
                                <div key={index} className={`flex-1 flex flex-col items-center justify-end h-full gap-1 group relative ${item.isProjected ? 'opacity-70' : ''}`}>
                                    {/* Tooltip */}
                                    <div className="absolute -top-12 bg-gray-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                                        Profit: {formatCurrency(item.profit)}
                                    </div>

                                    {/* Bars Container */}
                                    <div className="w-full h-full flex items-end justify-center gap-1">
                                        {/* Revenue Bar */}
                                        <div
                                            className={`w-3 md:w-6 bg-green-500 rounded-t-sm transition-all duration-500 ${item.isProjected ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(34,197,94,0.5)_5px,rgba(34,197,94,0.5)_10px)] bg-green-100 border border-green-500' : ''}`}
                                            style={{ height: `${Math.max(5, (item.revenue / maxChartValue) * 100)}%` }}
                                        ></div>
                                        {/* Expense Bar */}
                                        <div
                                            className={`w-3 md:w-6 bg-red-500 rounded-t-sm transition-all duration-500 ${item.isProjected ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(239,68,68,0.5)_5px,rgba(239,68,68,0.5)_10px)] bg-red-100 border border-red-500' : ''}`}
                                            style={{ height: `${Math.max(5, (item.expenses / maxChartValue) * 100)}%` }}
                                        ></div>
                                    </div>

                                    {/* Month Label */}
                                    <span className="text-xs text-gray-500 font-medium mt-2">{item.month}</span>
                                </div>
                            ))}
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
