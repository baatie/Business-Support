import { useEffect, useState, useRef } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MOCK_INVOICES } from '../lib/mockData'
import { Plus, Search, Printer, X, DollarSign, Edit, Trash2 } from 'lucide-react'
import InvoiceModal from '../components/InvoiceModal'
import RecordPaymentModal from '../components/RecordPaymentModal'
import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'

interface Invoice {
    id: string
    invoice_number: string
    customer_id: string
    issue_date: string
    due_date: string
    total_amount: number
    status: string
    items: any[]
    customers: {
        name: string
        email: string
        address?: string
        logo_url?: string
    }
    tax_rate?: number
    contact_id?: string
    customer_contacts?: {
        name: string
        email: string
    }
    expenses?: {
        id: string
        description: string
        amount: number
    }[]
}

export default function Invoices() {
    const { activeBusiness } = useBusiness()
    const { isDemo } = useAuth()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null)
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null)

    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Invoice-${selectedInvoice?.invoice_number}`,
    })

    const fetchInvoices = async () => {
        if (!activeBusiness) return
        setLoading(true)

        if (isDemo) {
            // @ts-ignore
            setInvoices(MOCK_INVOICES)
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(name, email, logo_url, address), customer_contacts(name, email), expenses(*)')
            .eq('business_id', activeBusiness.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
        } else {
            console.log('Fetched invoices:', data)
            setInvoices(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchInvoices()
    }, [activeBusiness, isDemo])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return

        if (isDemo) {
            setInvoices(invoices.filter(i => i.id !== id))
            return
        }

        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting invoice:', error)
            alert('Failed to delete invoice')
        } else {
            fetchInvoices()
        }
    }

    const handleEdit = (invoice: Invoice) => {
        setInvoiceToEdit(invoice)
        setIsModalOpen(true)
    }

    const filteredInvoices = invoices.filter(i =>
        i.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in text-[var(--color-primary)]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Invoices</h1>
                    <p className="text-[var(--color-secondary)]">Manage billing and payments</p>
                </div>
                <button
                    onClick={() => {
                        setInvoiceToEdit(null)
                        setIsModalOpen(true)
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} /> Create Invoice
                </button>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-[var(--color-secondary)]/20 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-secondary)]/10">
                            <tr>
                                <th className="p-4 font-semibold">Invoice #</th>
                                <th className="p-4 font-semibold">Customer</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Due Date</th>
                                <th className="p-4 font-semibold text-right">Yield</th>
                                <th className="p-4 font-semibold">Amount</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-secondary)]/10">
                            {filteredInvoices.map(invoice => {
                                const expensesSum = invoice.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
                                const yieldAmount = invoice.total_amount - expensesSum
                                const yieldPercent = invoice.total_amount > 0 ? (yieldAmount / invoice.total_amount) * 100 : 0

                                return (
                                    <tr key={invoice.id} className="hover:bg-[var(--color-bg)]/30 transition-colors">
                                        <td className="p-4 font-medium">{invoice.invoice_number}</td>
                                        <td className="p-4">{invoice.customers?.name}</td>
                                        <td className="p-4">{format(new Date(invoice.issue_date + 'T00:00:00'), 'MMM dd, yyyy')}</td>
                                        <td className="p-4">{format(new Date(invoice.due_date + 'T00:00:00'), 'MMM dd, yyyy')}</td>
                                        <td className="p-4 text-right font-medium">
                                            <div className="flex flex-col items-end">
                                                <span className={yieldAmount < 0 ? 'text-red-600' : 'text-green-600'}>
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD' }).format(yieldAmount)}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {yieldPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD' }).format(invoice.total_amount)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase
                      ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="p-4 flex items-center gap-1">
                                            <button
                                                onClick={() => setSelectedInvoice(invoice)}
                                                className="p-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
                                                title="Print/Preview"
                                            >
                                                <Printer size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(invoice)}
                                                className="p-2 text-[var(--color-secondary)] hover:text-blue-600 transition-colors"
                                                title="Edit Invoice"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            {invoice.status !== 'paid' && (
                                                <button
                                                    onClick={() => setSelectedInvoiceForPayment(invoice)}
                                                    className="p-2 text-[var(--color-secondary)] hover:text-green-600 transition-colors"
                                                    title="Record Payment"
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(invoice.id)}
                                                className="p-2 text-[var(--color-secondary)] hover:text-red-500 transition-colors"
                                                title="Delete Invoice"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center opacity-50">No invoices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <InvoiceModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchInvoices}
                    initialData={invoiceToEdit}
                />
            )}

            {selectedInvoiceForPayment && (
                <RecordPaymentModal
                    invoice={selectedInvoiceForPayment}
                    onClose={() => setSelectedInvoiceForPayment(null)}
                    onSuccess={fetchInvoices}
                />
            )}

            {/* Invoice Print Preview / Hidden Render */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl h-[90vh] flex flex-col rounded-xl overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold">Preview Invoice</h3>
                            <div className="flex gap-2">
                                <button onClick={() => handlePrint()} className="btn-primary flex items-center gap-2">
                                    <Printer size={16} /> Print / Save PDF
                                </button>
                                <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-gray-200 rounded">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-gray-100 p-8">
                            {/* The actual printable content */}
                            <div ref={printRef} className="bg-white shadow-lg p-12 max-w-[210mm] mx-auto min-h-[297mm] text-black">
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-800 mb-2">{activeBusiness?.name}</h1>
                                        <p className="text-gray-500">Invoice #{selectedInvoice.invoice_number}</p>
                                        <p className="text-gray-500">Status: <span className="uppercase">{selectedInvoice.status}</span></p>
                                    </div>
                                    <div className="text-right">
                                        {selectedInvoice.customers?.logo_url ? (
                                            <img src={selectedInvoice.customers.logo_url} alt="Logo" className="h-16 object-contain mb-2 ml-auto" />
                                        ) : (
                                            <div className="h-16 w-16 bg-gray-200 rounded ml-auto flex items-center justify-center text-xs">No Logo</div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-12">
                                    <div>
                                        <h4 className="font-bold text-gray-600 mb-2">Bill To:</h4>
                                        <p className="font-bold text-lg">{selectedInvoice.customers?.name}</p>
                                        <p>{selectedInvoice.customers?.email}</p>
                                        <p className="whitespace-pre-line">{selectedInvoice.customers?.address || ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="mb-2">
                                            <span className="text-gray-600">Issue Date:</span>
                                            <span className="font-medium ml-2">{format(new Date(selectedInvoice.issue_date + 'T00:00:00'), 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-gray-600">Due Date:</span>
                                            <span className="font-bold ml-2 text-red-600">{format(new Date(selectedInvoice.due_date + 'T00:00:00'), 'MMM dd, yyyy')}</span>
                                        </div>
                                        {selectedInvoice.customer_contacts && (
                                            <div className="mt-4 text-sm bg-gray-50 p-2 rounded inline-block text-left min-w-[200px]">
                                                <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Billing Contact</span>
                                                <span className="font-bold block">{selectedInvoice.customer_contacts.name}</span>
                                                <span className="block text-gray-500">{selectedInvoice.customer_contacts.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <table className="w-full mb-8">
                                    <thead>
                                        <tr className="border-b-2 border-gray-800">
                                            <th className="text-left py-3 font-bold">Description</th>
                                            <th className="text-right py-3 font-bold">Qty</th>
                                            <th className="text-right py-3 font-bold">Price</th>
                                            <th className="text-right py-3 font-bold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items?.map((item: any, i: number) => (
                                            <tr key={invoice_item_id(item, i)} className="border-b border-gray-200">
                                                <td className="py-3">{item.description}</td>
                                                <td className="py-3 text-right">{item.quantity}</td>
                                                <td className="py-3 text-right">${Number(item.price).toFixed(2)}</td>
                                                <td className="py-3 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="flex justify-end">
                                    <div className="w-1/3 border-t border-gray-300 pt-4">
                                        <div className="flex justify-between mb-2">
                                            <span>Subtotal:</span>
                                            <span>${(selectedInvoice.items?.reduce((s: number, i: any) => s + (i.quantity * i.price), 0) || 0).toFixed(2)}</span>
                                        </div>
                                        {(selectedInvoice.tax_rate || 0) > 0 && (
                                            <div className="flex justify-between mb-2 text-gray-600">
                                                <span>Tax ({selectedInvoice.tax_rate}%):</span>
                                                <span>${((selectedInvoice.items?.reduce((s: number, i: any) => s + (i.quantity * i.price), 0) || 0) * ((selectedInvoice.tax_rate || 0) / 100)).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-xl border-t border-gray-800 pt-2">
                                            <span>Total:</span>
                                            <span>${selectedInvoice.total_amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-200 print:hidden">
                                    <h4 className="font-bold text-gray-800 mb-4">Internal Details (Not on Invoice)</h4>

                                    <div className="grid grid-cols-2 gap-8 mb-6">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h5 className="font-medium text-gray-600 mb-2">Linked Expenses</h5>
                                            {selectedInvoice.expenses && selectedInvoice.expenses.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedInvoice.expenses.map((expense: any) => (
                                                        <div key={expense.id} className="flex justify-between text-sm">
                                                            <span>{expense.description}</span>
                                                            <span className="font-medium text-red-600">-${expense.amount.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-sm">
                                                        <span>Total Expenses:</span>
                                                        <span className="text-red-600">-${selectedInvoice.expenses.reduce((sum: number, e: any) => sum + e.amount, 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No expenses linked to this invoice.</p>
                                            )}
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                                            <h5 className="font-medium text-blue-800 mb-1">Net Yield / Profit</h5>
                                            <div className="text-3xl font-black text-blue-600 mb-1">
                                                ${(selectedInvoice.total_amount - (selectedInvoice.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0)).toFixed(2)}
                                            </div>
                                            <p className="text-xs text-blue-400">Total Amount - Linked Expenses</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
                                    <p>Thank you for your business!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function invoice_item_id(item: any, index: number) {
    return item.id || index;
}
