"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Battery, Signal } from "lucide-react";

// Map Import
const LiveMap = dynamic(() => import("@/components/Map/LiveMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />,
});


export default function AdminDashboard() {
  const stats = [
    { label: "Active Bands", value: "3,402", change: "+12%", icon: Signal, color: "blue" },
    { label: "SOS Alerts", value: "5", change: "2 Critical", icon: AlertTriangle, color: "red" },
    { label: "Registered Users", value: "12,900", change: "+54 this week", icon: Users, color: "teal" },
    { label: "Low Battery", value: "128", change: "Need Charging", icon: Battery, color: "orange" },
  ];

  // Dummy data for map pre-demo
  const mapData = [
     { id: '1', name: 'User A', lat: 28.61, lon: 77.21, sos: false, role: 'CITIZEN', lastUpdate: new Date().toISOString() },
     { id: '2', name: 'User B', lat: 28.62, lon: 77.22, sos: true, role: 'CITIZEN', lastUpdate: new Date().toISOString() }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Operational Overview</h1>
          <p className="text-slate-500">Real-time system monitoring</p>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800">Download Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded bg-${stat.color}-50 text-${stat.color}-700`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid for Maps and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden">
           <h3 className="font-bold text-slate-800 mb-4 px-2">Live Activity Map</h3>
           <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-200">
             {/* @ts-ignore */}
             <LiveMap users={mapData} />
           </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-4">Recent Alerts</h3>
           <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                      <div>
                          <p className="text-sm font-semibold text-slate-700">Medical Emergency</p>
                          <p className="text-xs text-slate-500">Sector 4 • 2 mins ago</p>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
