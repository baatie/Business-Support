import { useState, useEffect } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { supabase } from '../lib/supabase'
import { X, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface InvoiceModalProps {
    onClose: () => void
    onSuccess: () => void
    initialData?: any
}

interface InvoiceItem {
    id: string
    description: string
    quantity: number
    price: number
}

interface Customer {
    id: string
    name: string
}

interface Contact {
    id: string
    name: string
    email: string
    role?: string
}

export default function InvoiceModal({ onClose, onSuccess, initialData }: InvoiceModalProps) {
    const { activeBusiness } = useBusiness()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [contacts, setContacts] = useState<Contact[]>([])
    const [customerId, setCustomerId] = useState(initialData?.customer_id || '')
    const [contactId, setContactId] = useState(initialData?.contact_id || '')
    const [taxRate, setTaxRate] = useState<number>(initialData?.tax_rate || 0)
    const [issueDate, setIssueDate] = useState(initialData?.issue_date || format(new Date(), 'yyyy-MM-dd'))
    const [dueDate, setDueDate] = useState(initialData?.due_date || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
    const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || [
        { id: '1', description: '', quantity: 1, price: 0 }
    ])
    const [loading, setLoading] = useState(false)

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
        if (customerId) {
            // Fetch contacts for selected customer
            supabase
                .from('customer_contacts')
                .select('id, name, email, role')
                .eq('customer_id', customerId)
                .then(({ data }) => {
                    setContacts(data || [])
                    setContactId('') // Reset selection
                })
        } else {
            setContacts([])
            setContactId('')
        }
    }, [customerId])

    const handleAddItem = () => {
        setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, price: 0 }])
    }

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))
    }

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    }

    const calculateTotal = () => {
        const subtotal = calculateSubtotal()
        const tax = subtotal * (taxRate / 100)
        return subtotal + tax
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusiness || !customerId) return
        setLoading(true)

        try {
            // Calculate total
            const totalAmount = calculateTotal()

            // Generate invoice number (simple timestamp based for now)
            const invoiceNumber = initialData?.invoice_number || `INV-${Date.now().toString().slice(-6)}`

            const invoiceData = {
                business_id: activeBusiness.id,
                customer_id: customerId,
                issue_date: issueDate,
                due_date: dueDate,
                items: items,
                total_amount: totalAmount,
                tax_rate: taxRate,
                contact_id: contactId || null,
                invoice_number: invoiceNumber,
                status: initialData?.status || 'draft'
            }

            let error;
            if (initialData?.id) {
                const { error: updateError } = await supabase
                    .from('invoices')
                    .update(invoiceData)
                    .eq('id', initialData.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('invoices')
                    .insert([invoiceData])
                error = insertError
            }

            if (error) throw error
            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Failed to save invoice')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-2xl relative card my-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Invoice' : 'Create Invoice'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Customer</label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="input"
                                required
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Billing Contact</label>
                                <select
                                    value={contactId}
                                    onChange={(e) => setContactId(e.target.value)}
                                    className="input"
                                    disabled={!customerId || contacts.length === 0}
                                >
                                    <option value="">
                                        {!customerId ? 'Select Customer First' : contacts.length === 0 ? 'No Contacts Found' : 'Select Contact (Optional)'}
                                    </option>
                                    {contacts.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Issue Date</label>
                            <input
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">Items</label>
                            <button type="button" onClick={handleAddItem} className="text-[var(--color-primary)] text-sm flex items-center gap-1 hover:underline">
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-6">
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                            className="input py-1"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                                            className="input py-1 text-right"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            min="0"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))}
                                            className="input py-1 text-right"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1 text-center">
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                            <div className="text-gray-500">Subtotal:</div>
                            <div>{new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD' }).format(calculateSubtotal())}</div>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Tax Rate (%):</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                    className="input w-20 py-1 text-right text-sm"
                                />
                            </div>
                            <div className="text-gray-500">
                                + {new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD' }).format(calculateSubtotal() * (taxRate / 100))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-[var(--color-primary)] pt-2 border-t border-dashed border-gray-200">
                            <div>Total:</div>
                            <div>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD' }).format(calculateTotal())}
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn-primary">
                        {loading ? 'Creating...' : 'Create Invoice'}
                    </button>
                </form>
            </div>
        </div>
    )
}
