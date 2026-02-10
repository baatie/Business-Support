import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onFinish, 500) // Allow for fade-out animation
        }, 2500) // Show for 2.5s, total ~3s

        return () => clearTimeout(timer)
    }, [onFinish])

    return (
        <div
            className={`fixed inset-0 z-[100] bg-[var(--color-primary)] flex flex-col items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm mb-6 animate-bounce">
                <span className="text-white font-bold text-5xl">P</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 animate-pulse">
                Business Support
            </h1>
            <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm">
                Controller Pro
            </p>
        </div>
    )
}
