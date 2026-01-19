import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useState, useEffect, useMemo } from "react";
import L from "leaflet";
import { Ambulance, Navigation } from "lucide-react";

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

interface RescueMapProps {
  users?: MapUser[]; 
}

export default function RescueMap({ users = [] }: RescueMapProps) {
  const [mapData, setMapData] = useState<MapUser[]>(users);

  useEffect(() => {
      setMapData(users);
  }, [users]);

  // Calculate Crowd Center & Simulated Rescue Team Position
  const { center, rescuePos, path } = useMemo(() => {
      if (users.length === 0) return { center: [28.6139, 77.2090] as [number, number], rescuePos: null, path: [] };
      
      const totalLat = users.reduce((sum, u) => sum + u.lat, 0);
      const totalLon = users.reduce((sum, u) => sum + u.lon, 0);
      const avgLat = totalLat / users.length;
      const avgLon = totalLon / users.length;

      // Simulate Rescue Team being 1km away (approx 0.01 deg)
      const rLat = avgLat - 0.008; 
      const rLon = avgLon - 0.008;

      return {
          center: [avgLat, avgLon] as [number, number],
          rescuePos: [rLat, rLon] as [number, number],
          path: [[rLat, rLon], [avgLat, avgLon]] as [number, number][]
      };
  }, [users]);

  return (
    <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-slate-700 shadow-inner">
      <MapContainer 
        key={users.length > 0 ? users[0].id : 'default'} 
        center={center} 
        zoom={15} 
        scrollWheelZoom={false} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.flsm.dev">AasraSewa</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* --- HEATMAP SIMULATION --- */}
        {mapData.map((user, idx) => (
          <CircleMarker 
            key={user.id + idx}
            center={[user.lat, user.lon]}
            radius={25} // Large radius
            pathOptions={{ 
                stroke: false, 
                fillColor: 'red', 
                fillOpacity: 0.15 // Low opacity = overlapping creates intensity
            }}
          />
        ))}

        {/* --- CROWD CENTER ZONE --- */}
        <CircleMarker center={center} radius={50} pathOptions={{ color: 'red', fillColor: 'transparent', dashArray: '5, 10' }} />

        {/* --- RESCUE PATH --- */}
        {path.length > 0 && (
            <>
                <Polyline 
                    positions={path} 
                    pathOptions={{ color: 'blue', dashArray: '10, 10', weight: 4, opacity: 0.8 }} 
                />
                
                {/* Simulated Rescue Unit */}
                <Marker position={rescuePos!} icon={rescueIcon}>
                    <Popup>🚑 Rescue Team Alpha (En Route)</Popup>
                </Marker>

                {/* Destination */}
                <Marker position={center} icon={targetIcon}>
                    <Popup>🚨 Target Zone (High Density)</Popup>
                </Marker>
            </>
        )}

      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-2 right-2 bg-white/90 p-2 rounded text-xs text-black z-[1000] font-bold border border-slate-300">
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/50 rounded-full"></span> Crowd Density</div>
          <div className="flex items-center gap-1"><span className="w-3 h-1 bg-blue-500"></span> Optimal Path</div>
      </div>
    </div>
  );
}

// Icons
const rescueIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="bg-white rounded-full p-1 shadow-xl border-2 border-blue-600 flex items-center justify-center transform hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M19 19v2h-2v-2h-2v2H9v-2H5V9h14v10Z"/><path d="m19 9-5-5-5 5"/><path d="M18 19V9l-6-6-6 6v10"/><path d="M10 14h4"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const targetIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-xl animate-pulse"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});
