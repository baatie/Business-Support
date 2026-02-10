import { useState } from 'react'
import { useBusiness } from '../context/BusinessContext'

import { X } from 'lucide-react'

interface CreateBusinessModalProps {
    onClose: () => void
}

export default function CreateBusinessModal({ onClose }: CreateBusinessModalProps) {
    const { createBusiness } = useBusiness()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createBusiness(name, 'oak')
            onClose()
        } catch (error) {
            console.error(error)
            // @ts-ignore
            alert(`Failed to create business: ${error.message || error.error_description || JSON.stringify(error)}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md relative animate-fade-in card">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-4">Create New Business</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Business Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input"
                            required
                            placeholder="e.g. Acme Corp"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full btn-primary">
                        {loading ? 'Creating...' : 'Create Business'}
                    </button>
                </form>
            </div>
        </div>
    )
}
