import { useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { supabase } from '../lib/supabase'
import { X, Upload } from 'lucide-react'

interface CustomerModalProps {
    customer?: any
    onClose: () => void
    onSuccess: () => void
}

export default function CustomerModal({ customer, onClose, onSuccess }: CustomerModalProps) {
    const { activeBusiness } = useBusiness()
    // Pre-fill state if editing
    const [name, setName] = useState(customer?.name || '')
    const [email, setEmail] = useState(customer?.email || '')
    const [phone, setPhone] = useState(customer?.phone || '')
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusiness) return
        setLoading(true)

        try {
            let logoUrl = customer?.logo_url || null

            // Upload new logo if selected
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${activeBusiness.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('logos')
                    .upload(filePath, logoFile)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('logos').getPublicUrl(filePath)
                logoUrl = data.publicUrl
            }

            if (customer) {
                // UPDATE
                const { error } = await supabase
                    .from('customers')
                    .update({
                        name,
                        email,
                        phone,
                        logo_url: logoUrl
                    })
                    .eq('id', customer.id)

                if (error) throw error
            } else {
                // CREATE
                const { error } = await supabase
                    .from('customers')
                    .insert([
                        {
                            business_id: activeBusiness.id,
                            name,
                            email,
                            phone,
                            logo_url: logoUrl
                        }
                    ])

                if (error) throw error
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Failed to save customer')
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
                <h2 className="text-2xl font-bold mb-4">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Logo</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">{logoFile ? logoFile.name : 'Click to upload logo'}</p>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full btn-primary">
                        {loading ? 'Saving...' : 'Save Customer'}
                    </button>
                </form>
            </div>
        </div>
    )
}
