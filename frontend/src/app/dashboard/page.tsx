"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { User, Heart, Settings, Bell, Phone } from "lucide-react";

// Dynamic import for the Map to avoid SSR issues
const LiveMap = dynamic(() => import("@/components/Map/LiveMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-xl" />,
});

export default function UserDashboard() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const currentUser = [{
      id: 'current',
      name: 'You',
      lat: 28.6139,
      lon: 77.2090, 
      sos: false,
      role: 'CITIZEN',
      lastUpdate: new Date().toISOString()
  }];

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent_70%)] z-0" />

      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex justify-between items-center mb-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Hello, Praguni</h1>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-xs text-gray-400">Band Connected (88%)</span>
            </div>
          </div>
        </div>
        <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors relative">
           <Bell className="w-5 h-5" />
           <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </motion.header>

      {/* Main Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 grid grid-cols-2 gap-4"
      >
        {/* Vitals Card (Large) */}
        <motion.div variants={item} className="col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
           <div className="flex justify-between items-center mb-6">
               <h3 className="text-gray-400 font-medium">Heart Rate</h3>
               <Heart className="w-5 h-5 text-red-500" />
           </div>
           <div className="flex items-end gap-2">
               <span className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">72</span>
               <span className="text-xl text-gray-500 mb-2">bpm</span>
           </div>
           
           {/* Fake Graph Line */}
           <div className="h-12 mt-4 flex items-end gap-1 opacity-50">
               {[40,65,55,80,45,70,60,90,50,40,60].map((h, i) => (
                   <div key={i} className="flex-1 bg-red-500/50 rounded-t-sm" style={{ height: `${h}%` }}></div>
               ))}
           </div>
        </motion.div>

        {/* Live Location Map Widget */}
        <motion.div variants={item} className="col-span-2 h-64 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative">
            <div className="absolute top-4 left-4 z-[1000] bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                LIVE LOCATION
            </div>
             {/* @ts-ignore */}
            <LiveMap users={currentUser} />
        </motion.div>

        {/* Status Cards */}
        <motion.div variants={item} className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-5 flex flex-col justify-between h-40">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-2">
                <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
               <h3 className="font-bold">Settings</h3>
               <p className="text-xs text-gray-400">Device config</p>
            </div>
        </motion.div>

        <motion.div variants={item} className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-5 flex flex-col justify-between h-40">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-2">
                <Phone className="w-5 h-5 text-purple-400" />
            </div>
            <div>
               <h3 className="font-bold">Contacts</h3>
               <p className="text-xs text-gray-400">Emergency List</p>
            </div>
        </motion.div>

      {/* SOS Button (Big) */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
              const audio = new Audio('/siren.mp3'); // Sound file must exist in public folder
              audio.play().catch(e => console.error("Audio play failed", e));
              alert("SOS ALERT SENT! Emergency Services Notified.");
          }}
          className="col-span-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-6 shadow-2xl shadow-red-900/50 flex items-center justify-center gap-4 group mt-4 relative overflow-hidden"
        >
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
           
           <span className="text-3xl font-black tracking-widest relative z-10">SOS ALERT</span>
           <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse relative z-10">
              <Bell className="w-6 h-6 text-white" />
           </div>
        </motion.button>

      </motion.div>
    </div>
  );
}
