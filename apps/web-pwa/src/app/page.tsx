"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Activity, Lock, ArrowLeft, Loader2 } from "lucide-react";

// --- 3D Background Grid ---
function RetroGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-black via-black/90 to-transparent" />
    </div>
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

      // Force redirection based on intent & actual role
      // If user logs in as Admin but clicks Rescue, we still send them to Admin (security first)
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
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-hidden font-sans flex flex-col items-center justify-center relative">
      <RetroGrid />

      {/* Header / Logo */}
      <motion.div 
        layout 
        className="relative z-10 flex flex-col items-center mb-12"
      >
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20 mb-4 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
           <Activity className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 text-center">
          AASRA<span className="text-cyan-500">SEWA</span>
        </h1>
        <p className="text-gray-500 text-sm tracking-widest mt-2 uppercase">Secure Access Portal</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedRole === null ? (
          // --- ROLE SELECTION VIEW ---
          <motion.div 
            key="selection"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full px-4"
          >
            {/* Admin Option */}
            <motion.div
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => setSelectedRole("ADMIN")}
               className="cursor-pointer group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl flex flex-col items-center text-center hover:border-purple-500/50 transition-all shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:border-purple-400 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all">
                    <Shield className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Admin Command</h2>
                <p className="text-gray-400 text-sm">Full system control, map oversight, and rescue coordination.</p>
                <div className="mt-6 px-4 py-2 bg-purple-500/20 rounded-full text-xs font-mono text-purple-300 border border-purple-500/30">
                    SECURE_LEVEL: 1
                </div>
            </motion.div>

            {/* Rescue Option */}
            <motion.div
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => setSelectedRole("RESCUE")}
               className="cursor-pointer group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl flex flex-col items-center text-center hover:border-cyan-500/50 transition-all shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/30 group-hover:border-cyan-400 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all">
                    <Activity className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Rescue Team</h2>
                <p className="text-gray-400 text-sm">Field operations, live tracking, and emergency response.</p>
                <div className="mt-6 px-4 py-2 bg-cyan-500/20 rounded-full text-xs font-mono text-cyan-300 border border-cyan-500/30">
                    SECURE_LEVEL: 2
                </div>
            </motion.div>

          </motion.div>
        ) : (
          // --- LOGIN FORM VIEW ---
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-3xl w-full max-w-md shadow-2xl"
          >
             <button 
                onClick={() => setSelectedRole(null)}
                className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors"
                title="Back to selection"
             >
                 <ArrowLeft className="w-6 h-6" />
             </button>

             <div className="text-center mb-8 mt-4">
                 <h2 className="text-2xl font-bold mb-1">
                    {selectedRole === "ADMIN" ? "Command Access" : "Field Login"}
                 </h2>
                 <p className="text-gray-400 text-sm">Enter your secure credentials</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-5">
                <div>
                   <label className="text-xs font-mono text-gray-500 mb-1 block uppercase">Operator ID (Phone)</label>
                   <div className="relative">
                       <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 99999 99999"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                       />
                   </div>
                </div>

                <div>
                   <label className="text-xs font-mono text-gray-500 mb-1 block uppercase">Access Key</label>
                   <div className="relative">
                       <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                       />
                       <Lock className="absolute right-4 top-3.5 w-4 h-4 text-gray-600" />
                   </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   disabled={isLoading}
                   className={`w-full py-4 rounded-xl font-bold text-black shadow-lg flex items-center justify-center gap-2 transition-all ${
                       selectedRole === "ADMIN" 
                       ? "bg-purple-500 hover:bg-purple-400 shadow-purple-900/30" 
                       : "bg-cyan-500 hover:bg-cyan-400 shadow-cyan-900/30"
                   }`}
                >
                   {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AUTHENTICATE"}
                </motion.button>
             </form>

             <div className="mt-8 text-center">
                 <p className="text-xs text-gray-600 font-mono">
                     UNAUTHORIZED ACCESS IS PROHIBITED. <br/> SYSTEM LOGS ALL ATTEMPTS.
                 </p>
             </div>

          </motion.div>
        )}
      </AnimatePresence>

      
    </div>
  );
}
