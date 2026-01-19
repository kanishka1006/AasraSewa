import { useRef, useEffect, useState } from "react";

export default function DroneFeed() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [people, setPeople] = useState<{id: number, x: number, y: number, vx: number, vy: number}[]>([]);

    // Initialize Random Crowd
    useEffect(() => {
        const initialPeople = Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            x: 20 + Math.random() * 60, // Concentrated in middle
            y: 20 + Math.random() * 60,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        }));
        setPeople(initialPeople);

        // Animate Crowd (Panic Movement)
        const interval = setInterval(() => {
            setPeople(prev => prev.map(p => {
                let newX = p.x + p.vx;
                let newY = p.y + p.vy;

                // Bounce off walls
                if (newX < 5 || newX > 95) p.vx *= -1;
                if (newY < 5 || newY > 95) p.vy *= -1;

                // Add "Panic Jitter"
                newX += (Math.random() - 0.5) * 2;
                newY += (Math.random() - 0.5) * 2;

                return { ...p, x: newX, y: newY };
            }));
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-[300px] bg-black rounded-xl overflow-hidden border-2 border-slate-700 group">
             {/* Background: Thermal/Night Vision look */}
            <div className="absolute inset-0 bg-emerald-900/20"></div>

            {/* Simulated People (Dots) */}
            {people.map(p => (
                <div 
                    key={p.id}
                    className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] transition-all duration-100 ease-linear"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                />
            ))}
            
            {/* UI Overlay */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                <span className="bg-red-600/80 text-white px-2 py-0.5 text-[10px] font-bold rounded animate-pulse">REC ●</span>
                <span className="text-green-400 font-mono text-[10px]">BAT: 82% | ALT: 45m</span>
            </div>

            {/* AI Analysis Overlay */}
            <div className="absolute bottom-4 left-4 z-20">
                <div className="bg-red-600/20 border border-red-500/50 backdrop-blur-sm p-2 rounded">
                    <p className="text-red-400 font-bold text-xs animate-pulse">⚠ CRITICAL: RAPID MOVEMENT DETECTED</p>
                    <p className="text-green-400 font-mono text-[10px] mt-1">DENSITY: HIGH (4.5 ppl/m²)</p>
                </div>
            </div>

            {/* Computer Vision Boxes on a few random people */}
            <div className="absolute top-1/2 left-1/2 w-24 h-24 border border-red-500/50 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                 <div className="w-full h-[1px] bg-red-500/50 absolute"></div>
                 <div className="h-full w-[1px] bg-red-500/50 absolute"></div>
                 <span className="absolute -top-4 right-0 text-[8px] text-red-400 font-mono bg-black/50 px-1">LOCK_ON</span>
            </div>

            {/* Scan Lines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,255,0,0.02),rgba(0,255,0,0.02))] bg-[length:100%_2px,3px_100%] z-10"></div>
        </div>
    );
}
