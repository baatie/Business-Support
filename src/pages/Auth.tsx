import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function Auth() {
    const { startDemo } = useAuth()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [isReset, setIsReset] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (isReset) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password',
                })
                if (error) throw error
                setMessage('Check your email for the password reset link.')
            } else if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error

                if (data.session) {
                    navigate('/')
                } else {
                    setMessage('Account created! Please check your email to confirm.')
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                navigate('/')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#E5D3B3] p-4 text-[#3E2723]">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md border border-[#8D6E63]/30">
                <h2 className="text-3xl font-bold mb-6 text-center text-[#5D4037]">
                    {isReset ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-[#D7CCC8] focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent outline-none bg-white/50"
                            required
                        />
                    </div>
                    {!isReset && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium">Password</label>
                                {!isSignUp && (
                                    <button
                                        type="button"
                                        onClick={() => setIsReset(true)}
                                        className="text-xs text-[#8D6E63] hover:text-[#5D4037] hover:underline"
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-[#D7CCC8] focus:ring-2 focus:ring-[#8D6E63] focus:border-transparent outline-none bg-white/50"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5D4037] text-white py-2 rounded-lg hover:bg-[#4E342E] transition-colors font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : isReset ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm space-y-4">
                    {isReset ? (
                        <button
                            onClick={() => setIsReset(false)}
                            className="text-[#8D6E63] hover:text-[#5D4037] hover:underline"
                        >
                            Back to Sign In
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[#8D6E63] hover:text-[#5D4037] hover:underline"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    )}

                    {!isReset && (
                        <div className="pt-4 border-t border-[#8D6E63]/20">
                            <button
                                onClick={startDemo}
                                className="text-[#8D6E63] font-bold hover:text-[#5D4037] hover:underline uppercase text-xs tracking-wider"
                                type="button"
                            >
                                Enter Dev Mode
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
