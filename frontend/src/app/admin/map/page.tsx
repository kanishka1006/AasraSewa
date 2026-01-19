"use client";

import dynamic from "next/dynamic";
import { Filter, Search, Layers, Crosshair } from "lucide-react";
import { useState, useEffect } from "react";

// Dynamic Import for Map
const LiveMap = dynamic(() => import("@/components/Map/LiveMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Loading Map Engine...</div>,
});

export default function MapPage() {
    // Initial Dummy Data
    const initialData = [
         { id: '1', name: 'User A', lat: 28.61, lon: 77.21, sos: false, role: 'CITIZEN', lastUpdate: new Date().toISOString() },
         { id: '2', name: 'User B', lat: 28.62, lon: 77.22, sos: true, role: 'CITIZEN', lastUpdate: new Date().toISOString() },
         { id: '3', name: 'Shelter 1', lat: 28.63, lon: 77.23, sos: false, role: 'SHELTER', lastUpdate: new Date().toISOString() },
         { id: '4', name: 'Rescue Team', lat: 28.615, lon: 77.215, sos: false, role: 'ADMIN', lastUpdate: new Date().toISOString() },
    ];

    const [mapData, setMapData] = useState<any[]>(initialData);
    const [centerOn, setCenterOn] = useState<[number, number] | null>(null);

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    let placeName = "Unknown Location";
                    try {
                        // Reverse Geocoding via Nominatim (OpenStreetMap)
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        placeName = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : "Location Found";
                    } catch (e) {
                         console.error("Geocoding failed", e);
                    }

                    const myUser = {
                        id: 'ME-001',
                        name: 'Praguni Sanotra',
                        lat: latitude,
                        lon: longitude,
                        sos: false,
                        role: 'ADMIN', 
                        lastUpdate: new Date().toISOString(),
                        placeName: placeName
                    };
                    
                    // Update data
                    setMapData(prev => {
                        const filtered = prev.filter(u => u.id !== 'ME-001');
                        return [...filtered, myUser];
                    });
                    
                    // Center Map on ME
                    setCenterOn([latitude, longitude]);
                },
                (error) => {
                    console.error("Error getting location", error);
                    alert("Could not fetch location. Please enable permissions.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    // Auto-locate on load
    useEffect(() => {
        handleLocateMe(); 
    }, []);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" /> Live Situation Map
        </h1>
        
        <div className="flex gap-3">
            <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search coords or ID..." 
                    className="pl-9 pr-4 py-2 bg-slate-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500 outline-none w-64"
                />
            </div>
            
            <button 
                onClick={handleLocateMe}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-200 transition-all"
            >
                <Crosshair className="w-4 h-4 animate-spin-slow" /> Find Me (Praguni)
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700">
                <Filter className="w-4 h-4" /> Filters
            </button>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative z-0">
          <div className="absolute inset-0">
             {/* @ts-ignore */}
            <LiveMap users={mapData} centerOn={centerOn} />
          </div>
          
          {/* Floating Legend */}
          <div 
              className="absolute bottom-6 right-6 bg-white p-4 rounded-xl shadow-xl border-2 border-slate-200 w-64"
              style={{ zIndex: 9999 }}
          >
              <h4 className="text-xs font-bold text-black uppercase mb-3 tracking-wide">Map Legend</h4>
              <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full bg-blue-500 border border-blue-600 shadow-sm"></span>
                      <span className="text-slate-900 font-medium">Active Users / You</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full bg-red-500 animate-pulse border border-red-600 shadow-sm"></span>
                      <span className="font-bold text-red-600">SOS Signal</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full bg-green-500 border border-green-600 shadow-sm"></span>
                      <span className="text-slate-900 font-medium">Safe Zones / Shelters</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
