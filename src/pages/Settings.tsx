import { useState, useEffect } from 'react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Save, Building, Phone, MapPin, Calendar, Users, UserPlus, Trash2, Mail, AlertTriangle } from 'lucide-react'
import EditCategories from '../components/EditCategories'

interface Member {
    id: string
    user_id: string
    role: 'owner' | 'editor' | 'viewer'
    profile: {
        email: string
        full_name?: string
    }
}

export default function Settings() {
    const { activeBusiness, updateBusiness } = useBusiness()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'general' | 'team' | 'categories' | 'profile'>('general')

    // General Settings State
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [phone, setPhone] = useState('')
    const [netPay, setNetPay] = useState('')
    const [theme, setTheme] = useState('')

    // Profile Settings State
    const [fullName, setFullName] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [profileLoading, setProfileLoading] = useState(false)

    // Team Settings State
    const [members, setMembers] = useState<Member[]>([])
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')

    const [saving, setSaving] = useState(false)
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        if (activeBusiness) {
            setName(activeBusiness.name)
            setAddress(activeBusiness.address || '')
            setPhone(activeBusiness.phone || '')
            setNetPay(activeBusiness.net_pay_schedule || '')
            setTheme(activeBusiness.theme_preference)

            if (activeTab === 'team') {
                fetchMembers()
            }
        }
        if (activeTab === 'profile' && user) {
            fetchProfile()
        }
    }, [activeBusiness, activeTab, user])

    const fetchProfile = async () => {
        if (!user) return
        setProfileLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            if (error) throw error
            setFullName(data?.full_name || '')
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setProfileLoading(false)
        }
    }

    const fetchMembers = async () => {
        if (!activeBusiness) return
        setLoadingMembers(true)
        try {
            const { data, error } = await supabase
                .from('business_members')
                .select(`
                    *,
                    profile:profiles(email, full_name)
                `)
                .eq('business_id', activeBusiness.id)
                .
                // ... (rest of fetchMembers logic remains same, just ensuring context)
                eq('business_id', activeBusiness.id)

            if (error) throw error
            // @ts-ignore
            setMembers(data || [])
        } catch (error) {
            console.error('Error fetching members:', error)
        } finally {
            setLoadingMembers(false)
        }
    }

    const handleSaveGeneral = async (e: React.FormEvent) => {
        // ... (existing handleSaveGeneral)
        e.preventDefault()
        if (!activeBusiness) return
        setSaving(true)
        setMessage({ type: '', text: '' })

        try {
            await updateBusiness(activeBusiness.id, {
                name,
                address,
                phone,
                net_pay_schedule: netPay,
                theme_preference: theme as any
            })
            setMessage({ type: 'success', text: 'Settings saved successfully' })
        } catch (error) {
            console.error(error)
            setMessage({ type: 'error', text: 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeBusiness || !inviteEmail) return
        setSaving(true)
        setMessage({ type: '', text: '' })

        try {
            // 1. Find user by email (requiring them to have an account/profile first)
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', inviteEmail)
                .single()

            if (profileError || !profiles) {
                throw new Error('User not found. Ask them to sign up first!')
            }

            // 2. Add to business_members
            const { error: insertError } = await supabase
                .from('business_members')
                .insert({
                    business_id: activeBusiness.id,
                    user_id: profiles.id,
                    role: inviteRole
                })

            if (insertError) {
                if (insertError.code === '23505') throw new Error('User is already a member.')
                throw insertError
            }

            setMessage({ type: 'success', text: `Invited ${inviteEmail} successfully!` })
            setInviteEmail('')
            fetchMembers()
        } catch (error: any) {
            console.error(error)
            setMessage({ type: 'error', text: error.message || 'Failed to invite user.' })
        } finally {
            setSaving(false)
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return
        try {
            const { error } = await supabase
                .from('business_members')
                .delete()
                .eq('id', memberId)

            if (error) throw error
            setMembers(members.filter(m => m.id !== memberId))
        } catch (error) {
            console.error(error)
            alert('Failed to remove member')
        }
    }

    const handleDeleteBusiness = async () => {
        if (!activeBusiness) return
        if (!confirm('Are you absolutely sure you want to delete this business? This action cannot be undone and all associated data will be permanently lost.')) {
            return
        }

        setSaving(true)
        setMessage({ type: '', text: '' })

        try {
            const { error } = await supabase
                .from('businesses')
                .delete()
                .eq('id', activeBusiness.id)

            if (error) throw error

            setMessage({ type: 'success', text: 'Business deleted successfully. Reloading...' })
            setTimeout(() => {
                window.location.reload()
                window.location.href = '/'
            }, 1000)
        } catch (error: any) {
            console.error('Error deleting business:', error)
            setMessage({ type: 'error', text: error.message || 'Failed to delete business.' })
            setSaving(false)
        }
    }

    const isOwner = activeBusiness?.owner_id === user?.id

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setSaving(true)
        setMessage({ type: '', text: '' })

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id)

            if (error) throw error

            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error('Passwords do not match')
                }
                const { error: pwError } = await supabase.auth.updateUser({
                    password: newPassword
                })
                if (pwError) throw pwError
            }

            setMessage({ type: 'success', text: 'Profile updated successfully' })
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            console.error(error)
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    // ... (rest of render logic)

    if (!activeBusiness) return <div className="p-8">Loading...</div>

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in text-[var(--color-primary)]">
            <h1 className="text-3xl font-bold mb-2">Business Settings</h1>
            <p className="text-[var(--color-secondary)] mb-8">Manage {activeBusiness.name} profile and team</p>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-[var(--color-secondary)]/20 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'general'
                        ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
                        }`}
                >
                    General
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'categories'
                        ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
                        }`}
                >
                    Categories
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'team'
                        ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
                        }`}
                >
                    Team Members
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'profile'
                        ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
                        }`}
                >
                    User Profile
                </button>
            </div>

            {/* Feedback Message */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'general' ? (
                // ... (General tab content)
                <form onSubmit={handleSaveGeneral} className="space-y-6 animate-fade-in">
                    {/* General Info Card */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-[var(--color-secondary)]/10 pb-2">
                            <Building size={20} /> General Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Business Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input"
                                    required
                                    disabled={!isOwner}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone Number</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="input pl-10"
                                        placeholder="(555) 123-4567"
                                        disabled={!isOwner}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Address</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-3 opacity-50" />
                                    <textarea
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="input pl-10 min-h-[80px]"
                                        placeholder="123 Woodwork Lane..."
                                        disabled={!isOwner}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial & Preferences Card */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-[var(--color-secondary)]/10 pb-2">
                            Preferences
                        </h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Net Pay Schedule</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                <input
                                    list="net-pay-options"
                                    value={netPay}
                                    onChange={(e) => setNetPay(e.target.value)}
                                    className="input pl-10"
                                    placeholder="Select or type custom schedule (e.g. Net 45)"
                                    disabled={!isOwner}
                                />
                                <datalist id="net-pay-options">
                                    <option value="Net 7" />
                                    <option value="Net 15" />
                                    <option value="Net 30" />
                                    <option value="Net 60" />
                                    <option value="Due on Receipt" />
                                </datalist>
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary flex items-center gap-2 min-w-[120px] justify-center"
                            >
                                {saving ? <span className="animate-spin">⌛</span> : <Save size={20} />}
                                Save Changes
                            </button>
                        </div>
                    )}

                    {/* DANGER ZONE */}
                    {isOwner && (
                        <div className="mt-12 pt-8 border-t-2 border-red-100">
                            <h3 className="text-red-600 font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} /> Danger Zone
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-red-900">Delete this business</h4>
                                    <p className="text-sm text-red-700">
                                        Once you delete a business, there is no going back. All data (customers, invoices) will be lost.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDeleteBusiness}
                                    disabled={saving}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
                                >
                                    Delete Business
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            ) : activeTab === 'categories' ? (
                <EditCategories />
            ) : activeTab === 'profile' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fade-in">
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-[var(--color-secondary)]/10 pb-2">
                            User Profile
                        </h2>

                        {profileLoading ? <p>Loading profile...</p> : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="input"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="font-medium mb-3">Change Password</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="input"
                                                placeholder="Leave blank to keep current"
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="input"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary flex items-center gap-2 min-w-[120px] justify-center"
                        >
                            {saving ? <span className="animate-spin">⌛</span> : <Save size={20} />}
                            Update Profile
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* ... (Existing Team Members Tab content) */}
                    {isOwner && (
                        <div className="card bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <UserPlus size={20} /> Invite New Member
                            </h2>
                            <form onSubmit={handleInvite} className="flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="input pl-10"
                                            placeholder="colleague@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="w-1/3 space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        value={inviteRole}
                                        // @ts-ignore
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="input"
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                                <button type="submit" disabled={saving} className="btn-primary mb-[2px]">
                                    {saving ? 'Sending...' : 'Invite'}
                                </button>
                            </form>
                            <p className="text-xs mt-2 opacity-70">
                                Note: The user must already have an account to be invited.
                            </p>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-[var(--color-secondary)]/10 pb-2">
                            <Users size={20} /> Existing Members
                        </h2>

                        {loadingMembers ? (
                            <p>Loading members...</p>
                        ) : members.length === 0 ? (
                            <p className="text-center py-8 opacity-50">No additional members yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-[var(--color-secondary)]/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
                                                {member.profile?.email?.[0].toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold">{member.profile?.email}</p>
                                                <p className="text-xs opacity-70 capitalize">{member.role}</p>
                                            </div>
                                        </div>

                                        {isOwner && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                                title="Remove User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Owner Display */}
                        <div className="mt-6 pt-4 border-t border-[var(--color-secondary)]/10">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-2">Owner</p>
                            <div className="flex items-center gap-3 p-2 opacity-70">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] text-white flex items-center justify-center font-bold text-xs">
                                    O
                                </div>
                                <div>
                                    <p className="font-medium">Business Owner</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
