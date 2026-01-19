"use client";

import { useState, useEffect } from "react";
import LiveMap, { MapUser } from "@/components/Map";

// Types matching backend/database
interface SosAlert {
  id: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  notes: string;
  victim: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  rescuer?: {
    id: string;
    fullName: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
}

export default function RescueDashboard() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SosAlert | null>(null);

  // Poll for Active Alerts
  const fetchAlerts = async () => {
     try {
         // In real app, pass Authorization header
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sos/active`);
         if (res.ok) {
             const data = await res.json();
             setAlerts(data);
         }
     } catch (e) {
         console.error("Failed to fetch alerts", e);
     } finally {
         setLoading(false);
     }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Transform Alerts to Map Users
  const mapData: MapUser[] = alerts.map(alert => ({
    id: alert.victim.id,
    name: `🚨 ${alert.victim.fullName} (${alert.priority})`,
    lat: alert.location.coordinates[1],
    lon: alert.location.coordinates[0],
    sos: true,
    role: 'CITIZEN',
    lastUpdate: alert.createdAt
  }));

  // Handlers
  const handleAssign = async (alertId: string) => {
    const rescuerId = prompt("Enter Rescuer ID (UUID):");
    if (!rescuerId) return;

    await fetch('http://localhost:3001/sos/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, rescuerId })
    });
    fetchAlerts();
  };

  const handleResolve = async (alertId: string) => {
      const notes = prompt("Resolution Notes:");
      if (!notes) return;

      await fetch('http://localhost:3001/sos/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId, status: 'RESOLVED', notes })
      });
      fetchAlerts();
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* LEFT SIDEBAR: LIST */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-red-50">
          <h1 className="text-xl font-bold text-red-700 flex items-center gap-2">
            🚨 Rescue Coordination
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">{alerts.length} Active</span>
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <p className="text-gray-400 text-center">Loading live incidents...</p>}
          
          {alerts.map(alert => (
            <div 
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                 selectedAlert?.id === alert.id ? 'border-red-500 bg-red-50 shadow-md' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                 <span className={`text-xs font-bold px-2 py-1 rounded text-white ${
                     alert.priority === 'CRITICAL' ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
                 }`}>
                   {alert.priority}
                 </span>
                 <span className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleTimeString()}</span>
              </div>
              
              <h3 className="font-bold text-gray-900">{alert.victim.fullName}</h3>
              <p className="text-sm text-gray-600 mb-2">📞 {alert.victim.phoneNumber}</p>
              
              <div className="flex justify-between items-center text-xs mt-3">
                 <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                    Status: <strong>{alert.status}</strong>
                 </span>
                 {alert.rescuer && (
                     <span className="text-blue-600">Rescuer: {alert.rescuer.fullName}</span>
                 )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleAssign(alert.id); }}
                   className="bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-sm"
                 >
                   Assign Team
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                    className="bg-green-600 hover:bg-green-700 text-white py-1 rounded text-sm"
                 >
                   Resolve
                 </button>
              </div>
            </div>
          ))}
          
          {alerts.length === 0 && !loading && (
              <div className="text-center py-10 text-gray-400">
                  <p>No active SOS alerts.</p>
                  <p className="text-xs">System is monitoring...</p>
              </div>
          )}
        </div>
      </div>

      {/* RIGHT: MAP */}
      <div className="w-2/3 relative">
         {/* @ts-ignore */}
         <LiveMap users={mapData} />

         {/* Overlay Details if Selected */}
         {selectedAlert && (
             <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-200 z-[1000] flex justify-between items-center">
                 <div>
                     <h2 className="font-bold text-red-600">Active Incident Filtered</h2>
                     <p className="text-sm text-gray-600">Focusing map on {selectedAlert.victim.fullName}</p>
                 </div>
                 <button 
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-500 hover:text-gray-800"
                 > 
                   Reset View 
                 </button>
             </div>
         )}
      </div>
    </div>
  );
}
