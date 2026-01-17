"use client";

import LiveMap from "@/components/Map"; // Imports the dynamic wrapper

export default function DashboardPage() {
  // Mock Data
  const mockUsers = [
    { id: '1', name: 'Rohan (Citizen)', lat: 28.6129, lon: 77.2295, sos: false, role: 'CITIZEN', lastUpdate: new Date().toISOString() },
    { id: '2', name: 'Rescue Team A', lat: 28.6149, lon: 77.2305, sos: false, role: 'VOLUNTEER', lastUpdate: new Date().toISOString() },
    { id: '3', name: 'Priya (SOS)', lat: 28.6100, lon: 77.2200, sos: true, role: 'CITIZEN', lastUpdate: new Date().toISOString() },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-[family-name:var(--font-inter)]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mission Control Dashboard</h1>
        <p className="text-gray-500">Real-time tracking of relief operations</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 h-[600px]">
             {/* @ts-ignore */}
             <LiveMap users={mockUsers} />
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
              <h3 className="text-red-600 font-bold uppercase text-xs tracking-wider mb-2">Active SOS</h3>
              <p className="text-4xl font-extrabold text-gray-900">3</p>
              <p className="text-xs text-gray-500 mt-1">2 High Priority</p>
           </div>
           
           <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-blue-600 font-bold uppercase text-xs tracking-wider mb-2">Volunteers Active</h3>
              <p className="text-4xl font-extrabold text-gray-900">12</p>
              <p className="text-xs text-gray-500 mt-1">Sector 4, 5 deployed</p>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-4">Operations Log</h3>
               <ul className="space-y-3 text-sm">
                   <li className="flex items-start gap-2">
                       <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                       <span className="text-gray-600"><strong>SOS Alert</strong> received from Band #A1B2 near CP.</span>
                   </li>
                   <li className="flex items-start gap-2">
                       <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                       <span className="text-gray-600"><strong>Team Alpha</strong> reached Shelter 4.</span>
                   </li>
               </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
