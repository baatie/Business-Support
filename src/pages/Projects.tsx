import { useEffect, useState } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MOCK_PROJECTS } from '../lib/mockData'
import { Plus, Search, Folder, Calendar, DollarSign, Trash2, Pencil } from 'lucide-react'
import ProjectModal from '../components/ProjectModal'
import { format } from 'date-fns'

interface Project {
    id: string
    name: string
    status: string
    customer_id?: string
    description?: string
    start_date?: string
    end_date?: string
    budget?: number
    customers: {
        name: string
    }
}

export default function Projects() {
    const { activeBusiness } = useBusiness()
    const { isDemo } = useAuth()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchProjects = async () => {
        if (!activeBusiness) return
        setLoading(true)

        if (isDemo) {
            // @ts-ignore
            setProjects(MOCK_PROJECTS)
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*, customers(name)')
            .eq('business_id', activeBusiness.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
        } else {
            setProjects(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchProjects()
    }, [activeBusiness, isDemo])

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-100 text-blue-700'
            case 'completed': return 'bg-green-100 text-green-700'
            case 'archived': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

        if (error) {
            console.error(error)
            alert('Failed to delete project')
        } else {
            fetchProjects()
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-primary)]">Projects</h1>
                    <p className="text-[var(--color-secondary)]">Manage your work</p>
                </div>
                <button onClick={() => { setSelectedProject(null); setIsModalOpen(true) }} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Add Project
                </button>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search projects..."
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
                    {filteredProjects.map(project => (
                        <div key={project.id} className="card group hover:scale-[1.02] transition-transform duration-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-[var(--color-bg)] rounded-lg text-[var(--color-primary)]">
                                    <Folder size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-1">{project.name}</h3>
                            {project.customers?.name && (
                                <p className="text-sm text-[var(--color-secondary)] flex items-center gap-1 mb-4">
                                    Client: {project.customers.name}
                                </p>
                            )}

                            <div className="text-sm text-[var(--color-secondary)] mb-4 min-h-[40px]">
                                {project.description ? project.description.slice(0, 100) + (project.description.length > 100 ? '...' : '') : 'No description'}
                            </div>

                            <div className="flex gap-4 mb-4 text-xs text-gray-500">
                                {project.start_date && (
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} /> {format(new Date(project.start_date + 'T00:00:00'), 'MMM yyyy')}
                                    </div>
                                )}
                                {project.budget && (
                                    <div className="flex items-center gap-1">
                                        <DollarSign size={14} /> {new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD', maximumFractionDigits: 0 }).format(project.budget)}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-[var(--color-secondary)]/10">
                                <button
                                    onClick={() => { setSelectedProject(project); setIsModalOpen(true) }}
                                    className="flex-1 text-center py-2 text-sm text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]/10 rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    <Pencil size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(project.id)}
                                    className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredProjects.length === 0 && (
                        <div className="col-span-full text-center py-12 opacity-50">
                            <p>No projects found.</p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <ProjectModal
                    project={selectedProject}
                    onClose={() => { setIsModalOpen(false); setSelectedProject(null) }}
                    onSuccess={fetchProjects}
                />
            )}
        </div>
    )
}
