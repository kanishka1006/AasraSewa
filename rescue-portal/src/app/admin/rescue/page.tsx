"use client";

import { useState } from "react";
import { CheckCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";

export default function RescuePage() {
  const [activeTab, setActiveTab] = useState("active");

  const missions = [
    { id: "RES-101", type: "Medical", location: "Sector 4, Rohini", status: "In Progress", priority: "High", time: "2 mins ago", team: "Team Alpha" },
    { id: "RES-098", type: "Fire", location: "Industrial Area, Okhla", status: "Dispatched", priority: "Critical", time: "15 mins ago", team: "Team Bravo" },
    { id: "RES-095", type: "Flood", location: "Yamuna Bank", status: "Resolved", priority: "Medium", time: "2 hours ago", team: "Team Charlie" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Rescue Operations</h1>
          <p className="text-slate-500">Manage and tracking active emergency response teams</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
          + New Mission
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
             <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">5</h3>
            <p className="text-sm text-slate-500">Active Emergencies</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
             <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">12 min</h3>
            <p className="text-sm text-slate-500">Avg. Response Time</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-green-50 text-green-600 rounded-xl">
             <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">142</h3>
            <p className="text-sm text-slate-500">Missions Resolved</p>
          </div>
        </div>
      </div>

      {/* Mission List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex gap-4">
           {['active', 'completed', 'all'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                 activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
               }`}
             >
               {tab} Missions
             </button>
           ))}
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
            <tr>
              <th className="px-6 py-4">Mission ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Team</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {missions.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-800">{m.id}</td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${m.type === 'Medical' ? 'bg-red-50 text-red-600' : ''}
                      ${m.type === 'Fire' ? 'bg-orange-50 text-orange-600' : ''}
                      ${m.type === 'Flood' ? 'bg-blue-50 text-blue-600' : ''}
                   `}>
                     {m.type}
                   </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{m.location}</td>
                <td className="px-6 py-4 text-slate-600">{m.team}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full 
                        ${m.status === 'In Progress' ? 'bg-blue-500 animate-pulse' : ''}
                        ${m.status === 'Resolved' ? 'bg-green-500' : ''}
                        ${m.status === 'Dispatched' ? 'bg-amber-500' : ''}
                      `} />
                      <span className="text-sm text-slate-700">{m.status}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    Details <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
