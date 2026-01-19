"use client";

import { motion } from "framer-motion";
import { Ambulance, Radio, MapPin, CheckCircle, Bell } from "lucide-react";

export default function RescueHome() {
  const missions = [
    { id: "M-101", type: "Medical Evac", location: "Sector 4, Rohini", priority: "CRITICAL", time: "2m ago" },
    { id: "M-102", type: "Fire Response", location: "Industrial Area", priority: "HIGH", time: "15m ago" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 lg:p-8">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50">
                <Ambulance className="w-7 h-7 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Rescue Team Portal</h1>
                <p className="text-slate-400 text-sm">Unit: ALPHA-1 • Status: <span className="text-green-400 font-bold">ONLINE</span></p>
            </div>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-mono text-sm border border-slate-600 flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-400 animate-pulse" /> Channel: 142.5 MHz
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Missions */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" /> Incoming Dispatches
            </h2>
            
            <div className="space-y-4">
                {missions.map(m => (
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                        key={m.id} 
                        className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between items-center hover:bg-slate-750 transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${m.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-orange-500/20 text-orange-500'}`}>
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">{m.type}</h3>
                                <p className="text-slate-400">{m.location}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="bg-slate-900 px-2 py-1 rounded text-xs font-mono text-slate-500">{m.id}</span>
                                    <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs font-bold">{m.priority}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-200">{m.time}</p>
                            <button className="mt-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20">
                                ACCEPT
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Status Panel */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 h-fit">
            <h3 className="text-lg font-bold mb-4 text-slate-300">Team Status</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                    <span className="text-slate-400">Battery</span>
                    <span className="font-mono text-green-400">98%</span>
                </div>
                 <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                    <span className="text-slate-400">GPS Signal</span>
                    <span className="font-mono text-blue-400">Strong</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                    <span className="text-slate-400">Equipment</span>
                    <span className="font-mono text-green-400 flex items-center gap-2"><CheckCircle className="w-3 h-3" /> Ready</span>
                </div>
            </div>
            
            <button className="w-full mt-6 bg-red-600/20 text-red-400 border border-red-900/50 py-3 rounded-xl font-bold hover:bg-red-600/30 transition-colors">
                DECLARE EMERGENCY (SOS)
            </button>
        </div>
      </main>
    </div>
  );
}
