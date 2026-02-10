import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Plus, Trash2, Mail, Phone } from 'lucide-react'

interface Contact {
    id: string
    name: string
    email: string
    phone: string
    role: string
    is_primary: boolean
}

interface CustomerContactsModalProps {
    customerId: string
    customerName: string
    onClose: () => void
}

export default function CustomerContactsModal({ customerId, customerName, onClose }: CustomerContactsModalProps) {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState('')

    useEffect(() => {
        fetchContacts()
    }, [customerId])

    const fetchContacts = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('customer_contacts')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at')

            if (error) throw error
            setContacts(data || [])
        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !email) return
        setSaving(true)
        setError('')

        try {
            const { data, error } = await supabase
                .from('customer_contacts')
                .insert({
                    customer_id: customerId,
                    name,
                    email,
                    phone,
                    role,
                    is_primary: contacts.length === 0 // First contact is primary by default
                })
                .select()
                .single()

            if (error) throw error
            setContacts([...contacts, data])

            // Reset form
            setName('')
            setEmail('')
            setPhone('')
            setRole('')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this contact?')) return
        try {
            const { error } = await supabase
                .from('customer_contacts')
                .delete()
                .eq('id', id)

            if (error) throw error
            setContacts(contacts.filter(c => c.id !== id))
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleSetPrimary = async (contactId: string) => {
        try {
            // 1. Unset current primary
            await supabase
                .from('customer_contacts')
                .update({ is_primary: false })
                .eq('customer_id', customerId)

            // 2. Set new primary
            await supabase
                .from('customer_contacts')
                .update({ is_primary: true })
                .eq('id', contactId)

            fetchContacts()
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-xl w-full max-w-2xl relative card max-h-[90vh] overflow-hidden flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">Manage Contacts</h2>
                    <p className="text-[var(--color-secondary)]">For {customerName}</p>
                </div>

                <div className="flex-1 overflow-auto pr-2">
                    {/* Add New Form */}
                    <form onSubmit={handleAdd} className="bg-[var(--color-secondary)]/5 p-4 rounded-lg mb-6 border border-[var(--color-secondary)]/10">
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <Plus size={16} /> Add New Contact
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                                placeholder="Name (Required)"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="input text-sm"
                                required
                            />
                            <input
                                placeholder="Email (Required)"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input text-sm"
                                required
                            />
                            <input
                                placeholder="Phone"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="input text-sm"
                            />
                            <input
                                placeholder="Role (e.g. Billing, Manager)"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="input text-sm"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={saving} className="btn-primary text-sm py-1.5 px-3">
                                {saving ? 'Adding...' : 'Add Contact'}
                            </button>
                        </div>
                    </form>

                    {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}

                    {/* Contacts List */}
                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-center opacity-50">Loading contacts...</p>
                        ) : contacts.length === 0 ? (
                            <p className="text-center opacity-50 py-4">No contacts added yet.</p>
                        ) : (
                            contacts.map(contact => (
                                <div key={contact.id} className={`p-4 rounded-lg border flex items-center justify-between ${contact.is_primary ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30' : 'bg-white border-[var(--color-secondary)]/10'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${contact.is_primary ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-secondary)]'}`}>
                                            {contact.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold">{contact.name}</h4>
                                                {contact.is_primary && (
                                                    <span className="text-[10px] bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">Primary</span>
                                                )}
                                                {contact.role && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{contact.role}</span>
                                                )}
                                            </div>
                                            <div className="flex gap-4 text-sm text-[var(--color-secondary)] mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Mail size={14} /> {contact.email}
                                                </div>
                                                {contact.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone size={14} /> {contact.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!contact.is_primary && (
                                            <button
                                                onClick={() => handleSetPrimary(contact.id)}
                                                className="text-xs text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:underline mr-2"
                                            >
                                                Make Primary
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(contact.id)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
