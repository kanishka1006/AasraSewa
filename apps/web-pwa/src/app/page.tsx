"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Shield, Activity, Lock, Cpu, Globe } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// --- 3D Card Component ---
function Card3D({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  return (
    <div style={{ perspective: 2000 }}>
      <motion.div
        style={{ x, y, rotateX, rotateY, z: 100 }}
        drag
        dragElastic={0.16}
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        whileHover={{ cursor: "grabbing" }}
        className={`relative transform-style-3d transition-all duration-200 ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}

// --- Sci-Fi Background Grid ---
function RetroGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-black via-black/90 to-transparent" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-hidden font-sans">
      <RetroGrid />

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        
        {/* Floating Orb / Logo */}
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-10 relative group"
        >
             <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
             <div className="relative w-24 h-24 bg-black rounded-full flex items-center justify-center border border-white/10">
                 <Globe className="w-12 h-12 text-cyan-400 animate-spin-slow" />
             </div>
        </motion.div>

        <motion.h1
           initial={{ opacity: 0, y: 50, rotateX: -90 }}
           animate={{ opacity: 1, y: 0, rotateX: 0 }}
           transition={{ duration: 1, ease: "easeOut" }}
           className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500"
        >
          AASRA<span className="text-cyan-500">SEWA</span>
        </motion.h1>

        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-2xl text-cyan-200/60 max-w-3xl mx-auto mb-12"
        >
            Autonomous Disaster Response System
            <br />
            <span className="text-sm font-mono text-gray-500 border border-white/10 px-2 py-1 rounded bg-white/5 mt-2 inline-block">
                SYSTEM_VERSION: v2.4.0-ALPHA
            </span>
        </motion.p>
        
        {/* 3D Interactive Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-16 px-4">
            
            <Card3D className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl group hover:border-cyan-500/50">
               <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Activity className="w-6 h-6 text-cyan-400" />
               </div>
               <h3 className="text-xl font-bold mb-2">Live Telemetry</h3>
               <p className="text-sm text-gray-400">Real-time biometric monitoring of all rescue units.</p>
            </Card3D>

            <Card3D className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl group hover:border-purple-500/50">
               <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Cpu className="w-6 h-6 text-purple-400" />
               </div>
               <h3 className="text-xl font-bold mb-2">AI Neural Core</h3>
               <p className="text-sm text-gray-400">Predictive risk modeling and anomaly detection.</p>
            </Card3D>

            <Card3D className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl group hover:border-orange-500/50">
               <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <Shield className="w-6 h-6 text-orange-400" />
               </div>
               <h3 className="text-xl font-bold mb-2">Secure Ops</h3>
               <p className="text-sm text-gray-400">Encrypted comms and role-based access control.</p>
            </Card3D>

        </div>

        {/* CTA Buttons */}
        <div className="flex gap-6 z-20">
             <Link href="/login">
               <motion.button 
                 whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(6,182,212,0.5)" }}
                 whileTap={{ scale: 0.95 }}
                 className="px-8 py-4 bg-cyan-500 text-black font-bold rounded-xl flex items-center gap-2"
               >
                 Initialize System <ArrowRight className="w-5 h-5" />
               </motion.button>
             </Link>
             
             <Link href="/dashboard">
               <motion.button 
                 whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                 whileTap={{ scale: 0.95 }}
                 className="px-8 py-4 bg-transparent border border-white/20 text-white font-semibold rounded-xl"
               >
                 Demo Access
               </motion.button>
             </Link>
        </div>

      </main>

      {/* Decorative Bottom Fade */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-900/20 to-transparent pointer-events-none" />
    </div>
  );
}
