"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Radio, MapPin, CheckCircle, Bell, Wind, X, ArrowRight } from "lucide-react";

import dynamic from "next/dynamic";

const RescueMap = dynamic(() => import("../components/RescueMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-slate-500">Loading Sat-Nav...</div>,
});

export default function RescueHome() {
  const [missions, setMissions] = useState([
    { id: "M-101", type: "Medical Evac", location: "Sector 4, Rohini", priority: "CRITICAL", time: "2m ago", details: "Patient reported unresponsive. Ambulance dispatch required." },
    { id: "M-102", type: "Fire Response", location: "Industrial Area", priority: "HIGH", time: "15m ago", details: "Warehouse fire reported. Fire engines en route." },
  ]);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const acceptedIdsRef = useRef(new Set<string>());

  // Poll Backend for Alerts
  useEffect(() => {
     const checkAlerts = async () => {
         try {
             const res = await fetch('http://localhost:3001/alerts');
             if (!res.ok) return;
             
             const alerts = await res.json();
             if (alerts.length > 0) {
                 // Map to mission format
                 const newMissions = alerts.map((a: any) => ({
                     id: a.id,
                     type: a.type,
                     location: a.location,
                     priority: a.priority,
                     time: a.time,
                     details: a.details,
                     heatmapData: a.heatmapData // Include Crowd Data
                 }));
                 
                 setMissions(prev => {
                     // Get current IDs
                     const currentIds = new Set(prev.map(m => m.id));
                     
                     // Filter out: ALREADY IN LIST -or- ALREADY ACCEPTED
                     const uniqueNew = newMissions.filter((m: any) => 
                        !currentIds.has(m.id) && 
                        !acceptedIdsRef.current.has(m.id)
                     );

                     // If we found new items, prepend them
                     if(uniqueNew.length > 0) return [...uniqueNew, ...prev];
                     return prev;
                 });
             }
         } catch(e) {
             console.error("Polling error", e);
         }
     };

     // Poll every 2 seconds
     const interval = setInterval(checkAlerts, 2000);
     return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 lg:p-8 relative">
    
    {/* ... Header & Critical Section ... */}
    
    {/* (Existing JSX content...) is simplified here for replacement context, 
        I will target specific blocks to avoid huge replacement if possible, 
        but given the structure, I might need to replace the Modal section primarily. 
        Actually, I'll use a larger block replacement to be safe. 
    */}

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

      {/* Critical Alert Banner */}
      <AnimatePresence>
        {missions.some(m => m.priority === 'CRITICAL' && m.time === 'Just Now') && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }} 
               animate={{ height: "auto", opacity: 1 }} 
               exit={{ height: 0, opacity: 0 }}
               className="mb-8 bg-red-600 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-red-900/50 animate-pulse"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg">
                        <Wind className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">CRITICAL WEATHER / CROWD ALERT</h3>
                        <p className="text-red-100 text-sm">New high-priority dispatch received via Admin Command.</p>
                    </div>
                </div>
                <button 
                  onClick={() => setSelectedMission(missions.find(m => m.priority === 'CRITICAL' && m.time === 'Just Now'))}
                  className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-red-50"
                >
                    VIEW DETAILS
                </button>
            </motion.div>
        )}
      </AnimatePresence>

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
                            <button 
                                onClick={() => setSelectedMission(m)}
                                className="mt-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20"
                            >
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

      {/* Mission Details Modal */}
      <AnimatePresence>
        {selectedMission && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedMission(null)}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={() => setSelectedMission(null)}
                        className="absolute top-4 right-4 bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-slate-300" />
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className={`p-4 rounded-xl ${selectedMission.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            <MapPin className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-slate-800 text-slate-400 text-xs font-mono px-2 py-1 rounded">{selectedMission.id}</span>
                                <span className={`${selectedMission.priority === 'CRITICAL' ? 'text-red-400' : 'text-blue-400'} font-bold text-sm`}>{selectedMission.priority}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">{selectedMission.type}</h2>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                             <h4 className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Location</h4>
                             <p className="text-lg text-white font-medium">{selectedMission.location}</p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                             <h4 className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Time Reported</h4>
                             <p className="text-lg text-white font-medium">{selectedMission.time}</p>
                        </div>
                        
                        {/* Heatmap Visualization for Stampede */}
                        {selectedMission.heatmapData && (
                            <div className="rounded-xl overflow-hidden border-2 border-slate-700 relative">
                                <div className="absolute top-2 left-2 z-[9999] bg-slate-900/90 text-slate-300 text-xs px-2 py-1 rounded font-mono">
                                    LIVE DRONE FEED
                                </div>
                                <RescueMap users={selectedMission.heatmapData} />
                            </div>
                        )}

                        {selectedMission.details && (
                             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                 <h4 className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Alert Details</h4>
                                 <p className="text-base text-slate-300 leading-relaxed">{selectedMission.details}</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setSelectedMission(null)}
                            className="bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                acceptedIdsRef.current.add(selectedMission.id);
                                setMissions(prev => prev.filter(m => m.id !== selectedMission.id));
                                setSelectedMission(null);
                                alert(`Mission ${selectedMission.id} Accepted. Deployment Team notified.`);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            Confirm Deployment <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
