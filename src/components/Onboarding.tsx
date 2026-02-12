import { useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { Building, ArrowRight } from 'lucide-react'

export default function Onboarding() {
    const { createBusiness } = useBusiness()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            await createBusiness(name, 'oak') // Default theme
        } catch (error) {
            console.error('Failed to create business:', error)
            alert('Failed to create business. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[url('/src/assets/wood-grain.png')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/95 backdrop-blur rounded-2xl shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#5D4037] text-white rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Building size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#3E2723]">Welcome Aboard!</h1>
                    <p className="text-[#5D4037]/80 mt-2">Let's get your business set up.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#5D4037] mb-2">
                            What is your Business Name?
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-[#D7CCC8] focus:ring-2 focus:ring-[#8D6E63] outline-none"
                            placeholder="e.g. Acme Woodworks"
                            required
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5D4037] text-white py-3 rounded-lg font-bold hover:bg-[#4E342E] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        {loading ? (
                            'Setting up...'
                        ) : (
                            <>
                                Get Started <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
