"use client";

import { Search, Battery, Wifi, Shield, ShieldAlert, MoreVertical } from "lucide-react";

export default function UsersPage() {
    const users = [
        { id: 1, name: "Rohan Gupta", bandId: "B-2901", status: "Safe", battery: 98, lastSeen: "Now", location: "Sector 4" },
        { id: 2, name: "Amit Sharma", bandId: "B-2902", status: "SOS", battery: 12, lastSeen: "1m ago", location: "Yamuna Ghat" },
        { id: 3, name: "Priya Singh", bandId: "B-2905", status: "Safe", battery: 45, lastSeen: "5m ago", location: "Dwarka" },
        { id: 4, name: "Suresh Kumar", bandId: "B-2910", status: "Disconnected", battery: 0, lastSeen: "2h ago", location: "Old Delhi" },
    ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold text-slate-800">Band Users</h1>
         <div className="flex gap-3">
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Export CSV</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Add User</button>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by Name, Band ID, or Location..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none">
                <option>All Status</option>
                <option>Safe</option>
                <option>SOS</option>
                <option>Disconnected</option>
            </select>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
            <tr>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Band ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Battery</th>
              <th className="px-6 py-4">Connectivity</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.location}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50/50 rounded">{user.bandId}</td>
                <td className="px-6 py-4">
                    {user.status === 'Safe' && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                            <Shield className="w-4 h-4" /> <span className="text-xs font-bold">Safe</span>
                        </div>
                    )}
                     {user.status === 'SOS' && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full w-fit animate-pulse">
                            <ShieldAlert className="w-4 h-4" /> <span className="text-xs font-bold">SOS</span>
                        </div>
                    )}
                     {user.status === 'Disconnected' && (
                        <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                            <Wifi className="w-4 h-4" /> <span className="text-xs font-bold">Offline</span>
                        </div>
                    )}
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Battery className={`w-5 h-5 ${user.battery < 20 ? 'text-red-500' : 'text-slate-400'}`} />
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${user.battery < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${user.battery}%` }} 
                            />
                        </div>
                        <span className="text-xs font-mono">{user.battery}%</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                    Last seen {user.lastSeen}
                </td>
                <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-5 h-5" />
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
