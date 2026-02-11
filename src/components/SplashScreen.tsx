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
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{
                backgroundImage: 'url(/src/assets/wood-grain.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

            <div className="relative z-10 w-32 h-32 bg-white/10 rounded-3xl flex flex-col items-center justify-center backdrop-blur-md mb-8 animate-bounce border border-white/20 shadow-2xl">
                <span
                    className="font-black text-5xl leading-none tracking-tighter mb-2 bg-clip-text text-transparent bg-center bg-cover drop-shadow-sm"
                    style={{ backgroundImage: 'url(/src/assets/purple-heart.png)' }}
                >
                    BSC
                </span>
                <span className="text-blue-100 font-bold text-xl tracking-[0.3em] drop-shadow-md">PRO</span>
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
