import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, DollarSign, Calendar, CreditCard, Hash } from 'lucide-react'
import { format } from 'date-fns'

interface RecordPaymentModalProps {
    invoice: any
    onClose: () => void
    onSuccess: () => void
}

export default function RecordPaymentModal({ invoice, onClose, onSuccess }: RecordPaymentModalProps) {
    const [amount, setAmount] = useState('')
    const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [method, setMethod] = useState('Transfer')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !invoice) return
        setLoading(true)

        try {
            // 1. Record Payment
            const { error: paymentError } = await supabase
                .from('invoice_payments')
                .insert({
                    invoice_id: invoice.id,
                    amount: parseFloat(amount),
                    payment_date: paymentDate,
                    payment_method: method,
                    reference_number: reference,
                    notes: notes
                })

            if (paymentError) throw paymentError

            // 2. Check totals and update status if paid
            // We need to fetch all payments to see if it's fully paid now.
            const { data: payments } = await supabase
                .from('invoice_payments')
                .select('amount')
                .eq('invoice_id', invoice.id)

            // @ts-ignore
            const totalPaid = (payments?.reduce((sum, p) => sum + p.amount, 0) || 0)

            // If we just added this one, it might not be in the fetch yet if read-after-write consistency is laggy, 
            // but usually it's fine. To be safe, let's trust the fetch or add current amount if we want to be optimistic.
            // Actually, we should rely on the fetched data which includes the new insert.

            if (totalPaid >= invoice.total_amount) {
                await supabase
                    .from('invoices')
                    .update({ status: 'paid' })
                    .eq('id', invoice.id)
            } else if (invoice.status === 'draft' || invoice.status === 'overdue') {
                // Should we move to 'sent' or 'partial'? we don't have 'partial' yet.
                // Let's at least ensure it's not 'draft' if we took money?
                // For now, leave status alone unless fully paid.
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Failed to record payment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-xl w-full max-w-md relative card">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-1">Record Payment</h2>
                <p className="text-sm text-[var(--color-secondary)] mb-6">
                    For Invoice #{invoice.invoice_number} • Total: ${invoice.total_amount.toFixed(2)}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Payment Amount</label>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input pl-10"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Payment Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="input pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Method</label>
                            <div className="relative">
                                <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="input pl-10"
                                >
                                    <option value="Transfer">Transfer</option>
                                    <option value="Check">Check</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Reference / Confirm #</label>
                        <div className="relative">
                            <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="input pl-10"
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input min-h-[80px]"
                            placeholder="Optional notes..."
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn-primary">
                        {loading ? 'Recording...' : 'Record Payment'}
                    </button>
                </form>
            </div>
        </div>
    )
}
