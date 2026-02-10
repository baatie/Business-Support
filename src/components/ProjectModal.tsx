import { useState, useEffect } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { supabase } from '../lib/supabase'
import { X, Calendar, DollarSign, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface ProjectModalProps {
    project?: any
    onClose: () => void
    onSuccess: () => void
}

interface Customer {
    id: string
    name: string
}

export default function ProjectModal({ project, onClose, onSuccess }: ProjectModalProps) {
    const { activeBusiness } = useBusiness()
    const [customers, setCustomers] = useState<Customer[]>([])

    // Form State
    const [name, setName] = useState(project?.name || '')
    const [status, setStatus] = useState(project?.status || 'active')
    const [description, setDescription] = useState(project?.description || '')
    const [customerId, setCustomerId] = useState(project?.customer_id || '')
    const [startDate, setStartDate] = useState(project?.start_date || format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(project?.end_date || '')
    const [budget, setBudget] = useState(project?.budget || '')
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusiness) return
        setLoading(true)

        try {
            const payload = {
                business_id: activeBusiness.id,
                name,
                status,
                description,
                customer_id: customerId || null,
                start_date: startDate || null,
                end_date: endDate || null,
                budget: parseFloat(budget) || 0
            }

            if (project) {
                // UPDATE
                const { error } = await supabase
                    .from('projects')
                    .update(payload)
                    .eq('id', project.id)
                if (error) throw error
            } else {
                // CREATE
                const { error } = await supabase
                    .from('projects')
                    .insert([payload])
                if (error) throw error
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Failed to save project')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg relative card">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-6">{project ? 'Edit Project' : 'New Project'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="input"
                            >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                                <option value="on_hold">On Hold</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Customer</label>
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <div className="relative">
                            <FileText size={18} className="absolute left-3 top-3 opacity-50" />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input pl-10 min-h-[80px]"
                                placeholder="Project details..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="input pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="input pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Budget</label>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                            <input
                                type="number"
                                step="0.01"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn-primary mt-4">
                        {loading ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
                    </button>
                </form>
            </div>
        </div>
    )
}
