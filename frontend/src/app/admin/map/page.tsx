"use client";

import dynamic from "next/dynamic";
import { Filter, Search, Layers } from "lucide-react";

// Dynamic Import for Map
const LiveMap = dynamic(() => import("@/components/Map/LiveMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Loading Map Engine...</div>,
});

export default function MapPage() {
    // Dummy Data
    const mapData = [
         { id: '1', name: 'User A', lat: 28.61, lon: 77.21, sos: false, role: 'CITIZEN', lastUpdate: new Date().toISOString() },
         { id: '2', name: 'User B', lat: 28.62, lon: 77.22, sos: true, role: 'CITIZEN', lastUpdate: new Date().toISOString() },
         { id: '3', name: 'Shelter 1', lat: 28.63, lon: 77.23, sos: false, role: 'SHELTER', lastUpdate: new Date().toISOString() },
         { id: '4', name: 'Rescue Team', lat: 28.615, lon: 77.215, sos: false, role: 'ADMIN', lastUpdate: new Date().toISOString() },
    ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" /> Live Situation Map
        </h1>
        
        <div className="flex gap-3">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search coords or ID..." 
                    className="pl-9 pr-4 py-2 bg-slate-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500 outline-none w-64"
                />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700">
                <Filter className="w-4 h-4" /> Filters
            </button>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative z-0">
          <div className="absolute inset-0">
             {/* @ts-ignore */}
            <LiveMap users={mapData} />
          </div>
          
          {/* Floating Legend */}
          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-100 w-64">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Map Legend</h4>
              <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <span>Active Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="font-semibold text-red-600">SOS Signal</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span>Safe Zones / Shelters</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
