"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Shield, Activity, Lock, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

// --- 3D Background Grid ---
function RetroGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-black via-black/90 to-transparent" />
      
      {/* Floating 3D Cubes (CSS only) */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-tl from-cyan-500/10 to-transparent blur-3xl animate-pulse delay-1000" />
    </div>
  );
}

// --- 3D Tilt Card Component ---
function Card3D({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative transition-all duration-200 ease-out ${className}`}
    >
      <div style={{ transform: "translateZ(50px)" }}>
        {children}
      </div>
    </motion.div>
  );
}

export default function LandingLoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "RESCUE" | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, password }),
      });

      if (!res.ok) throw new Error("Access Denied: Invalid Credentials");

      const data = await res.json();
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "ADMIN" || data.user.role === "SHELTER_MANAGER") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-hidden font-sans flex flex-col items-center justify-center relative perspective-[2000px]">
      <RetroGrid />

      {/* Header / Logo */}
      <motion.div 
        layout 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center mb-12"
      >
        <motion.div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden relative border-2 border-white/20"
        >
           <Image 
             src="/AasraSewa_Logo.jpeg" 
             alt="AasraSewa Logo" 
             fill
             className="object-cover"
           />
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500 text-center drop-shadow-2xl">
          AASRA<span className="text-cyan-500">SEWA</span>
        </h1>
        <div className="flex items-center gap-2 mt-3">
             <div className="h-[1px] w-8 bg-cyan-500/50"></div>
             <p className="text-cyan-500/80 text-xs tracking-[0.3em] uppercase font-bold">Autonomous Response System</p>
             <div className="h-[1px] w-8 bg-cyan-500/50"></div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedRole === null ? (
          // --- ROLE SELECTION VIEW ---
          <motion.div 
            key="selection"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full px-6"
          >
            {/* Admin Option */}
            <Card3D 
               onClick={() => setSelectedRole("ADMIN")}
               className="cursor-pointer group bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center text-center hover:border-purple-500/70 transition-colors shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                
                <div className="w-24 h-24 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <Shield className="w-12 h-12 text-purple-400" />
                </div>
                
                <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-200">Admin Command</h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[200px] mx-auto">Full system control, map oversight, and rescue coordination.</p>
                
                <div className="mt-8 px-4 py-2 bg-purple-500/10 rounded-full text-[10px] font-mono text-purple-300 border border-purple-500/20 tracking-wider">
                    SECURE_LEVEL: 1
                </div>
            </Card3D>

            {/* Rescue Option */}
            <Card3D 
               onClick={() => setSelectedRole("RESCUE")}
               className="cursor-pointer group bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center text-center hover:border-cyan-500/70 transition-colors shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                
                <div className="w-24 h-24 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-8 border border-cyan-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                    <Activity className="w-12 h-12 text-cyan-400" />
                </div>
                
                <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-cyan-200">Rescue Team</h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[200px] mx-auto">Field operations, live tracking, and emergency response.</p>
                
                <div className="mt-8 px-4 py-2 bg-cyan-500/10 rounded-full text-[10px] font-mono text-cyan-300 border border-cyan-500/20 tracking-wider">
                    SECURE_LEVEL: 2
                </div>
            </Card3D>

          </motion.div>
        ) : (
          // --- LOGIN FORM VIEW ---
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 50, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 50, rotateX: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative z-10 bg-black/60 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[2rem] w-full max-w-md shadow-2xl"
            style={{ transformStyle: "preserve-3d" }}
          >
             <button 
                onClick={() => setSelectedRole(null)}
                className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors hover:-translate-x-1 duration-200"
                title="Back to selection"
             >
                 <ArrowLeft className="w-6 h-6" />
             </button>

             <div className="text-center mb-10 mt-6">
                 <h2 className={`text-3xl font-bold mb-2 ${selectedRole === "ADMIN" ? "text-purple-400" : "text-cyan-400"}`}>
                    {selectedRole === "ADMIN" ? "Command Access" : "Field Login"}
                 </h2>
                 <p className="text-gray-400 text-sm">Enter your secure credentials</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-6">
                <div>
                   <label className="text-[10px] font-mono text-gray-500 mb-2 block uppercase tracking-wider">Operator ID (Phone)</label>
                   <div className="relative group">
                       <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 99999 99999"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-mono"
                       />
                       <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-mono text-gray-500 mb-2 block uppercase tracking-wider">Access Key</label>
                   <div className="relative group">
                       <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-mono"
                       />
                       <Lock className="absolute right-4 top-4 w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                   </div>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <motion.button 
                   whileHover={{ scale: 1.02, boxShadow: selectedRole === "ADMIN" ? "0 0 20px rgba(168,85,247,0.4)" : "0 0 20px rgba(6,182,212,0.4)" }}
                   whileTap={{ scale: 0.98 }}
                   disabled={isLoading}
                   className={`w-full py-4 rounded-xl font-bold text-black shadow-lg flex items-center justify-center gap-2 transition-all mt-4 ${
                       selectedRole === "ADMIN" 
                       ? "bg-purple-500 hover:bg-purple-400 shadow-purple-900/20" 
                       : "bg-cyan-500 hover:bg-cyan-400 shadow-cyan-900/20"
                   }`}
                >
                   {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AUTHENTICATE"}
                </motion.button>
             </form>

             <div className="mt-8 text-center border-t border-white/5 pt-6">
                 <p className="text-[10px] text-gray-600 font-mono tracking-widest opacity-60">
                     AASRASEWA SECURE SYSTEM v2.4 <br/> UNAUTHORIZED ACCESS LOGGED
                 </p>
             </div>

          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 w-full text-center z-50">
          <p className="text-[10px] md:text-xs text-white/30 font-mono tracking-[0.2em] uppercase">
              Developed By Team Innovexia @2025
          </p>
      </div>
    </div>
  );
}
