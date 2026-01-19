"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useState, useEffect } from "react";
import L from "leaflet";

// Types
export interface MapUser {
  id: string;
  name: string;
  lat: number;
  lon: number;
  sos: boolean;
  role: 'CITIZEN' | 'VOLUNTEER' | 'ADMIN';
  lastUpdate: string;
  placeName?: string;
}

interface LiveMapProps {
  users?: MapUser[];
  centerOn?: [number, number] | null; 
}

// Helper to recenter map
function MapRecenter({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15, { duration: 2 });
        }
    }, [center, map]);
    return null;
}

export default function LiveMap({ users = [], centerOn = null }: LiveMapProps) {
  const [mapData, setMapData] = useState<MapUser[]>(users);
  const [filter, setFilter] = useState({ sosOnly: false, showVolunteers: true, showCitizens: true });

  // Update internal state when props change
  useEffect(() => {
      setMapData(users);
  }, [users]);

  // Filter Logic
  const filteredUsers = mapData.filter((user) => {
    if (filter.sosOnly && !user.sos) return false;
    if (!filter.showVolunteers && user.role === 'VOLUNTEER') return false;
    if (!filter.showCitizens && user.role === 'CITIZEN') return false;
    return true;
  });

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-gray-200 shadow-lg">
      
      {/* Filters Overlay */}
      <div 
        className="absolute top-4 right-4 bg-white p-4 rounded-md shadow-xl flex flex-col gap-2 w-48 border-2 border-gray-200"
        style={{ zIndex: 9999 }}
      >
        <h3 className="font-bold text-sm text-black mb-1">Map Filters</h3>
        
        <label className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
          <input 
            type="checkbox" 
            checked={filter.sosOnly} 
            onChange={e => setFilter({...filter, sosOnly: e.target.checked})}
            className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
          />
          <span className="font-bold text-red-600">SOS Calls Only</span>
        </label>

        <label className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
          <input 
            type="checkbox" 
            checked={filter.showVolunteers} 
            onChange={e => setFilter({...filter, showVolunteers: e.target.checked})}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
          />
          <span className="text-black font-medium">Volunteers</span>
        </label>

        <label className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
          <input 
            type="checkbox" 
            checked={filter.showCitizens} 
            onChange={e => setFilter({...filter, showCitizens: e.target.checked})}
            className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
          />
          <span className="text-black font-medium">Citizens</span>
        </label>
      </div>

      {/* Map */}
      <MapContainer 
        center={[28.6139, 77.2090]} // Default: New Delhi
        zoom={13} 
        scrollWheelZoom={true} 
        className="w-full h-full min-h-[500px]"
      >
        <MapRecenter center={centerOn} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.flsm.dev">AasraSewa</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredUsers.map((user) => (
          <Marker 
            key={user.id} 
            position={[user.lat, user.lon]}
            icon={
                user.id === 'ME-001' ? meIcon :
                user.sos ? sosIcon : 
                (user.role === 'VOLUNTEER' ? volunteerIcon : citizenIcon)
            }
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <h4 className="font-bold text-base">{user.name} <span className="text-xs text-gray-500 font-normal">({user.role})</span></h4>
                {user.sos && <div className="text-red-600 font-bold animate-pulse mt-1 text-xs">🚨 SOS ACTIVE</div>}
                
                {/* Place Name Display */}
                <div className="flex items-start gap-1 mt-2 mb-1">
                    <span className="text-lg">📍</span>
                    <p className="text-sm font-semibold text-slate-700 leading-tight">
                        {user.placeName || "Fetching location..."}
                    </p>
                </div>

                <p className="text-xs text-gray-500">Lat: {user.lat.toFixed(4)}, Lon: {user.lon.toFixed(4)}</p>
                <p className="text-xs text-gray-400 mt-1">Updated: {new Date(user.lastUpdate).toLocaleTimeString()}</p>
                <button className="mt-3 w-full bg-blue-600 text-white text-xs py-1.5 px-2 rounded-md hover:bg-blue-700 font-medium transition-colors">
                  Track History
                </button>
              </div>
            </Popup>
            
            {/* Add pulsing circle for SOS */}
            {user.sos && (
               <CircleMarker center={[user.lat, user.lon]} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }} radius={20} />
            )}
             {/* Add pulsing circle for ME */}
            {user.id === 'ME-001' && (
               <CircleMarker center={[user.lat, user.lon]} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} radius={30} />
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// Custom Icons logic
const meIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="relative">
            <div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-xl z-20 absolute top-0 left-0 flex items-center justify-center">
                <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div class="w-8 h-8 bg-blue-500 rounded-full absolute top-0 left-0 animate-ping opacity-75 z-10"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const sosIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg animate-bounce"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const volunteerIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const citizenIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});
