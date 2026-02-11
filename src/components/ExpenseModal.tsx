import { useState, useEffect } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { supabase } from '../lib/supabase'
import { X, Upload } from 'lucide-react'
import { format } from 'date-fns'

interface ExpenseModalProps {
    onClose: () => void
    onSuccess: () => void
    initialData?: any
}

interface Customer {
    id: string
    name: string
}

interface Invoice {
    id: string
    invoice_number: string
}



export default function ExpenseModal({ onClose, onSuccess, initialData }: ExpenseModalProps) {
    const { activeBusiness } = useBusiness()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [categories, setCategories] = useState<string[]>(['Other'])
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
    const [category, setCategory] = useState(initialData?.category || 'Other')
    const [customCategory, setCustomCategory] = useState('')
    const [date, setDate] = useState(initialData?.date || format(new Date(), 'yyyy-MM-dd'))
    const [description, setDescription] = useState(initialData?.description || '')
    const [customerId, setCustomerId] = useState(initialData?.customer_id || '')
    const [invoiceId, setInvoiceId] = useState(initialData?.invoice_id || '')
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initialData && categories.length > 0 && !categories.includes(initialData.category)) {
            setCategory('Other')
            setCustomCategory(initialData.category)
        }
    }, [initialData, categories])

    useEffect(() => {
        if (activeBusiness) {
            supabase
                .from('customers')
                .select('id, name')
                .eq('business_id', activeBusiness.id)
                .then(({ data }) => setCustomers(data || []))
        }
    }, [activeBusiness])

    useEffect(() => {
        if (activeBusiness) {
            // Fetch custom categories
            supabase
                .from('custom_expense_categories')
                .select('name')
                .eq('business_id', activeBusiness.id)
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        setCategories([...data.map(c => c.name), 'Other'])
                        // Set initial category to first available if current is not valid
                        if (!data.map(c => c.name).includes(category) && category !== 'Other') {
                            setCategory(data[0].name)
                        }
                    } else {
                        setCategories(['Other'])
                        setCategory('Other')
                    }
                })

            // Fetch invoices
            let query = supabase
                .from('invoices')
                .select('id, invoice_number')
                .eq('business_id', activeBusiness.id)

            if (customerId) {
                query = query.eq('customer_id', customerId)
            }

            query.then(({ data }) => setInvoices(data || []))
        }
    }, [activeBusiness, customerId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusiness) return
        setLoading(true)

        try {
            const finalCategory = category === 'Other' ? customCategory : category
            let receiptUrl = initialData?.receipt_url || null

            if (receiptFile) {
                const fileExt = receiptFile.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${activeBusiness.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(filePath, receiptFile)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('receipts').getPublicUrl(filePath)
                receiptUrl = data.publicUrl
            }

            const payload = {
                business_id: activeBusiness.id,
                customer_id: customerId || null,
                invoice_id: invoiceId || null,
                amount: parseFloat(amount),
                category: finalCategory,
                date,
                description,
                receipt_url: receiptUrl
            }

            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from('expenses')
                    .update(payload)
                    .eq('id', initialData.id)
                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase
                    .from('expenses')
                    .insert([payload])
                if (error) throw error
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Failed to save expense')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md relative card">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-4">{initialData ? 'Edit Expense' : 'Add Expense'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input pl-8"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Link to Invoice (Optional)</label>
                        <select
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            className="input"
                        >
                            <option value="">None</option>
                            {invoices.map(i => (
                                <option key={i.id} value={i.id}>{i.invoice_number}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="input mb-2"
                        >
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        {category === 'Other' && (
                            <input
                                type="text"
                                placeholder="Enter custom category"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className="input"
                                required
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Receipt (Optional)</label>
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                                <Upload size={16} />
                                {receiptFile ? 'Change File' : 'Upload Receipt'}
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                />
                            </label>
                            {receiptFile && <span className="text-sm text-gray-600 truncate">{receiptFile.name}</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Assign to Customer (Optional)</label>
                        <select
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="input"
                        >
                            <option value="">None</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn-primary">
                        {loading ? 'Saving...' : 'Save Expense'}
                    </button>
                </form>
            </div>
        </div>
    )
}
