import { useEffect, useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MOCK_EXPENSES } from '../lib/mockData'
import { Plus, Search, Filter, FileText, Link, Pencil, Trash2 } from 'lucide-react'
import ExpenseModal from '../components/ExpenseModal'
import { format } from 'date-fns'

interface Expense {
    id: string
    amount: number
    category: string
    date: string
    description: string
    customers: {
        name: string
    }
    receipt_url?: string
    invoice_id?: string
    invoices?: {
        invoice_number: string
    }
}

export default function Expenses() {
    const { activeBusiness } = useBusiness()
    const { isDemo } = useAuth()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

    const fetchExpenses = async () => {
        if (!activeBusiness) return
        setLoading(true)

        if (isDemo) {
            // @ts-ignore
            setExpenses(MOCK_EXPENSES)
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('expenses')
            .select('*, customers(name), invoices(invoice_number)')
            .eq('business_id', activeBusiness.id)
            .order('date', { ascending: false })

        if (error) {
            console.error(error)
        } else {
            setExpenses(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchExpenses()
    }, [activeBusiness, isDemo])

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = filterCategory ? e.category === filterCategory : true
        return matchesSearch && matchesCategory
    })

    // Derive unique categories for filter
    const categories = Array.from(new Set(expenses.map(e => e.category)))

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)

            if (error) throw error
            setExpenses(expenses.filter(e => e.id !== id))
        } catch (error) {
            console.error(error)
            alert('Failed to delete expense')
        }
    }

    const openEditModal = (expense: Expense) => {
        setSelectedExpense(expense)
        setIsModalOpen(true)
    }

    const openCreateModal = () => {
        setSelectedExpense(null)
        setIsModalOpen(true)
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-primary)]">Expenses</h1>
                    <p className="text-[var(--color-secondary)]">Track your spending</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Add Expense
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>

                <div className="relative w-full md:w-64">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="input pl-10 appearance-none"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-[var(--color-secondary)]/20 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-secondary)]/10">
                            <tr>
                                <th className="p-4 font-semibold text-[var(--color-primary)]">Date</th>
                                <th className="p-4 font-semibold text-[var(--color-primary)]">Description</th>
                                <th className="p-4 font-semibold text-[var(--color-primary)]">Category</th>
                                <th className="p-4 font-semibold text-[var(--color-primary)]">Customer</th>
                                <th className="p-4 font-semibold text-[var(--color-primary)]">Ref</th>
                                <th className="p-4 font-semibold text-[var(--color-primary)]">Amount</th>
                                <th className="p-4 font-semibold text-[var(--color-primary)] w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-secondary)]/10">
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-[var(--color-bg)]/30 transition-colors group">
                                    <td className="p-4">{format(new Date(expense.date + 'T00:00:00'), 'MMM dd, yyyy')}</td>
                                    <td className="p-4 font-medium">{expense.description}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="p-4">{expense.customers?.name || '-'}</td>
                                    <td className="p-4 flex items-center gap-2">
                                        {expense.receipt_url && (
                                            <a
                                                href={expense.receipt_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-[var(--color-primary)]"
                                                title="View Receipt"
                                            >
                                                <FileText size={16} />
                                            </a>
                                        )}
                                        {expense.invoices?.invoice_number && (
                                            <span
                                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1"
                                                title="Linked Invoice"
                                            >
                                                <Link size={12} />
                                                {expense.invoices.invoice_number}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 font-medium text-red-600">
                                        -{new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD' }).format(expense.amount)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(expense)}
                                                className="p-1 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center opacity-50">No expenses found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <ExpenseModal
                    initialData={selectedExpense}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchExpenses}
                />
            )}
        </div>
    )
}
