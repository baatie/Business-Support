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

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo Container */}
                <div className="relative mb-12">
                    {/* Diamond Shape with Purple Heart Texture */}
                    <div
                        className="w-32 h-32 rounded-3xl rotate-45 flex items-center justify-center shadow-2xl animate-fade-in"
                        style={{
                            backgroundImage: 'url(/src/assets/purple-heart.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        {/* Un-rotate text inside */}
                        <div className="-rotate-45">
                            <span className="text-white font-black text-4xl tracking-tighter drop-shadow-md">
                                BSC
                            </span>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2 mb-8 animate-slide-up">
                    <h2 className="text-white/80 text-sm font-bold tracking-[0.3em] uppercase">
                        Business Support
                    </h2>
                    <h1 className="text-white text-3xl font-black tracking-[0.2em] uppercase drop-shadow-lg">
                        Controller Pro
                    </h1>
                </div>

                {/* Loading Bar */}
                <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full animate-progress origin-left"></div>
                </div>
            </div>
        </div>
    )
}
