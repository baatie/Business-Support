import { useEffect, useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MOCK_CUSTOMERS } from '../lib/mockData'
import CustomerModal from '../components/CustomerModal'
import CustomerContactsModal from '../components/CustomerContactsModal'
import { Plus, Trash2, Search, Building, Pencil, Users } from 'lucide-react'

interface Customer {
    id: string
    name: string
    email: string
    phone: string
    logo_url: string | null
}

export default function Customers() {
    const { activeBusiness } = useBusiness()
    const { isDemo } = useAuth()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null)
    const [selectedCustomerForContacts, setSelectedCustomerForContacts] = useState<Customer | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchCustomers = async () => {
        if (!activeBusiness) return
        setLoading(true)

        if (isDemo) {
            setCustomers(MOCK_CUSTOMERS)
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('business_id', activeBusiness.id)
            .order('name', { ascending: true })

        if (error) {
            console.error(error)
        } else {
            setCustomers(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCustomers()
    }, [activeBusiness, isDemo])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return

        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Failed to delete')
        } else {
            setCustomers(customers.filter(c => c.id !== id))
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-primary)]">Customers</h1>
                    <p className="text-[var(--color-secondary)]">Manage your client base</p>
                </div>
                <button onClick={() => { setSelectedCustomerForEdit(null); setIsModalOpen(true) }} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Add Customer
                </button>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map(customer => (
                        <div key={customer.id} className="card group hover:scale-[1.02] transition-transform duration-200">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    {customer.logo_url ? (
                                        <img src={customer.logo_url} alt={customer.name} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-secondary)]/30" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-primary)] border-2 border-[var(--color-secondary)]/30">
                                            <Building size={32} />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--color-primary)]">{customer.name}</h3>
                                        <p className="text-sm text-[var(--color-secondary)]">{customer.email || 'No email'}</p>
                                        <p className="text-sm text-[var(--color-secondary)]">{customer.phone || 'No phone'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setSelectedCustomerForContacts(customer)}
                                        className="p-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]/10 rounded"
                                        title="Manage Contacts"
                                    >
                                        <Users size={18} />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedCustomerForEdit(customer); setIsModalOpen(true) }}
                                        className="p-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]/10 rounded"
                                        title="Edit Customer"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(customer.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Delete Customer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredCustomers.length === 0 && (
                        <div className="col-span-full text-center py-12 opacity-50">
                            <p>No customers found.</p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <CustomerModal
                    customer={selectedCustomerForEdit}
                    onClose={() => { setIsModalOpen(false); setSelectedCustomerForEdit(null) }}
                    onSuccess={fetchCustomers}
                />
            )}

            {selectedCustomerForContacts && (
                <CustomerContactsModal
                    customerId={selectedCustomerForContacts.id}
                    customerName={selectedCustomerForContacts.name}
                    onClose={() => setSelectedCustomerForContacts(null)}
                />
            )}
        </div>
    )
}
