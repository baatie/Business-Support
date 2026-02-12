import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { LayoutDashboard, Users, FileText, PieChart, Briefcase, Plus, LogOut, ChevronDown, Menu, X, Settings as SettingsIcon } from 'lucide-react'
import CreateBusinessModal from './CreateBusinessModal'
import Onboarding from './Onboarding'

export default function Layout() {
    const { signOut, user } = useAuth()
    const { businesses, activeBusiness, switchBusiness, loading: businessLoading } = useBusiness()
    // businessLoading renamed to avoid conflict if we used loading from auth, but we don't here.
    const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/invoices', label: 'Invoices', icon: FileText },
        { path: '/expenses', label: 'Expenses', icon: PieChart },
        { path: '/projects', label: 'Projects', icon: Briefcase },
        { path: '/settings', label: 'Settings', icon: SettingsIcon },
    ]

    const handleSignOut = async () => {
        await signOut()
        navigate('/auth')
    }

    if (businessLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    // Show onboarding if user has no businesses
    if (user && businesses.length === 0) {
        return <Onboarding />
    }

    return (
        <div className="min-h-screen flex bg-[var(--color-bg)] text-[var(--color-primary)] bg-pattern">
            {/* Mobile Menu Button */}
            <div className="fixed top-4 left-4 z-50 md:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-[var(--color-surface)] rounded-md shadow-md"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-[var(--color-surface)]/95 backdrop-blur-md border-r border-[var(--color-secondary)]/20 transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static
            `}>
                <div className="h-full flex flex-col p-4">
                    {/* Logo/Brand */}
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-blue-600 flex flex-col items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 border border-white/10">
                            <span className="text-white font-black text-sm leading-none tracking-tighter">BSC</span>
                            <span className="text-[8px] font-bold text-blue-100/80 tracking-widest mt-0.5">PRO</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight text-[var(--color-primary)]">
                                Business Support
                            </h1>
                            <p className="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-wider">
                                Controller Pro
                            </p>
                        </div>
                    </div>

                    {/* Business Selector */}
                    <div className="relative mb-6">
                        <button
                            onClick={() => setIsBusinessDropdownOpen(!isBusinessDropdownOpen)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50 hover:bg-[var(--color-bg)] transition-colors text-left border border-[var(--color-secondary)]/10"
                        >
                            <span className="font-medium truncate pr-2">
                                {activeBusiness?.name || 'Select Business'}
                            </span>
                            <ChevronDown size={16} className={`transform transition-transform ${isBusinessDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isBusinessDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-surface)] rounded-lg shadow-xl border border-[var(--color-secondary)]/20 overflow-hidden z-50">
                                {businesses.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => {
                                            switchBusiness(b.id)
                                            setIsBusinessDropdownOpen(false)
                                        }}
                                        className={`w-full text-left p-3 hover:bg-[var(--color-bg)] transition-colors ${activeBusiness?.id === b.id ? 'bg-[var(--color-bg)]/50 font-medium' : ''}`}
                                    >
                                        {b.name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setIsBusinessDropdownOpen(false)
                                        setIsBusinessModalOpen(true)
                                    }}
                                    className="w-full flex items-center gap-2 p-3 text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors border-t border-[var(--color-secondary)]/10 font-medium"
                                >
                                    <Plus size={16} /> Create Business
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {navItems.map(item => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                                            : 'text-[var(--color-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]'
                                        }
                                    `}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="pt-4 border-t border-[var(--color-secondary)]/20">
                        <div className="flex items-center gap-3 px-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center text-[var(--color-primary)] font-bold text-xs">
                                {user?.email?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2 text-[var(--color-secondary)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto w-full md:w-auto p-4 md:p-0">
                <div className="h-4 md:hidden"></div> {/* Spacer for mobile menu button */}
                {activeBusiness ? (
                    <Outlet />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h2 className="text-2xl font-bold mb-4 opacity-80">No Business Selected</h2>
                        <p className="mb-8 opacity-60">Create a business to get started.</p>
                        <button
                            onClick={() => setIsBusinessModalOpen(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={20} /> Create Business
                        </button>
                    </div>
                )}
            </main>

            {isBusinessModalOpen && (
                <CreateBusinessModal onClose={() => setIsBusinessModalOpen(false)} />
            )}
        </div>
    )
}
