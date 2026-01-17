"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
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
}

interface LiveMapProps {
  users?: MapUser[]; // Pass initial data or let it fetch
}

export default function LiveMap({ users = [] }: LiveMapProps) {
  const [mapData, setMapData] = useState<MapUser[]>(users);
  const [filter, setFilter] = useState({ sosOnly: false, showVolunteers: true, showCitizens: true });

  // Simulate Live Updates (if no real websocket yet)
  useEffect(() => {
    const interval = setInterval(() => {
      // Logic to fetch new data would go here
      // For now, we trust the props or simple local state updates
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-md shadow-md flex flex-col gap-2 w-48">
        <h3 className="font-bold text-sm text-gray-700 mb-1">Map Filters</h3>
        
        <label className="flex items-center space-x-2 text-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={filter.sosOnly} 
            onChange={e => setFilter({...filter, sosOnly: e.target.checked})}
            className="rounded text-red-600 focus:ring-red-500"
          />
          <span className="font-medium text-red-600">SOS Calls Only</span>
        </label>

        <label className="flex items-center space-x-2 text-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={filter.showVolunteers} 
            onChange={e => setFilter({...filter, showVolunteers: e.target.checked})}
            className="rounded text-blue-600"
          />
          <span>Volunteers</span>
        </label>

        <label className="flex items-center space-x-2 text-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={filter.showCitizens} 
            onChange={e => setFilter({...filter, showCitizens: e.target.checked})}
            className="rounded text-green-600"
          />
          <span>Citizens</span>
        </label>
      </div>

      {/* Map */}
      <MapContainer 
        center={[28.6139, 77.2090]} // Default: New Delhi
        zoom={13} 
        scrollWheelZoom={true} 
        className="w-full h-full min-h-[500px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.flsm.dev">AasraSewa</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredUsers.map((user) => (
          <Marker 
            key={user.id} 
            position={[user.lat, user.lon]}
            icon={user.sos ? sosIcon : (user.role === 'VOLUNTEER' ? volunteerIcon : citizenIcon)}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold">{user.name} <span className="text-xs text-gray-500">({user.role})</span></h4>
                {user.sos && <div className="text-red-600 font-bold animate-pulse mt-1">🚨 SOS ACTIVE</div>}
                <p className="text-xs text-gray-600 mt-1">Lat: {user.lat.toFixed(4)}, Lon: {user.lon.toFixed(4)}</p>
                <p className="text-xs text-gray-400">Updated: {new Date(user.lastUpdate).toLocaleTimeString()}</p>
                <button className="mt-2 w-full bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700">
                  Track History
                </button>
              </div>
            </Popup>
            
            {/* Add pulsing circle for SOS */}
            {user.sos && (
               <CircleMarker center={[user.lat, user.lon]} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }} radius={20} />
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// Custom Icons logic
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
