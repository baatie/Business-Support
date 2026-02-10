import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Tag, AlertCircle } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'

interface Category {
    id: string
    name: string
    is_default: boolean
}

export default function EditCategories() {
    const { activeBusiness } = useBusiness()
    const [categories, setCategories] = useState<Category[]>([])
    const [newCategory, setNewCategory] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (activeBusiness) fetchCategories()
    }, [activeBusiness])

    const fetchCategories = async () => {
        if (!activeBusiness) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('expense_categories')
                .select('*')
                .eq('business_id', activeBusiness.id)
                .order('name')

            if (error) throw error
            setCategories(data || [])
        } catch (err: any) {
            console.error('Error fetching categories:', err)
            // If table doesn't exist yet (migration pending), fail gracefully
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategory.trim() || !activeBusiness) return
        setError('')

        try {
            // Check for duplicate locally
            if (categories.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
                throw new Error('Category already exists')
            }

            const { data, error } = await supabase
                .from('expense_categories')
                .insert({
                    business_id: activeBusiness.id,
                    name: newCategory.trim(),
                    is_default: false
                })
                .select()
                .single()

            if (error) throw error
            setCategories([...categories, data])
            setNewCategory('')
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete category "${name}"? Expenses using this category will keep the name but lose the link.`)) return

        try {
            const { error } = await supabase
                .from('expense_categories')
                .delete()
                .eq('id', id)

            if (error) throw error
            setCategories(categories.filter(c => c.id !== id))
        } catch (err: any) {
            alert('Failed to delete category: ' + err.message)
        }
    }

    return (
        <div className="card animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-[var(--color-secondary)]/10 pb-2">
                <Tag size={20} /> Expense Categories
            </h2>

            <p className="text-sm text-[var(--color-secondary)] mb-6">
                Manage custom categories for your expenses. These will appear in the dropdown when recording expenses.
            </p>

            {/* Add New Form */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New Category Name (e.g. Travel, Software)"
                    className="input flex-1"
                />
                <button
                    type="submit"
                    disabled={!newCategory.trim()}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} /> Add
                </button>
            </form>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 flex items-center gap-2 text-sm">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="text-center py-4 opacity-50">Loading categories...</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-8 bg-[var(--color-secondary)]/5 rounded-lg border border-dashed border-[var(--color-secondary)]/20">
                    <p className="opacity-60">No custom categories yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-white/60 border border-[var(--color-secondary)]/10 rounded group">
                            <span className="font-medium">{cat.name}</span>
                            {!cat.is_default && (
                                <button
                                    onClick={() => handleDelete(cat.id, cat.name)}
                                    className="text-[var(--color-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    title="Delete Category"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
