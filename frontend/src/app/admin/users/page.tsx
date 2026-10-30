"use client";

import { useState, useEffect } from "react";
import { Search, Battery, Wifi, Shield, ShieldAlert, MoreVertical, Loader2 } from "lucide-react";

type User = {
    _id?: string;
    id?: string;
    fullName: string;
    age?: number;
    phoneNumber: string;
    isSafe: boolean;
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('http://localhost:3001/auth/users');
                const data = await res.json();
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold text-slate-800">Database Users</h1>
         <div className="flex gap-3">
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Export CSV</button>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by Name or Phone..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none">
                <option>All Status</option>
                <option>Safe</option>
                <option>At Risk</option>
            </select>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
            <tr>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Age</th>
              <th className="px-6 py-4">Phone Number</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Device Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const userId = user._id || user.id;
              return (
              <tr key={userId || user.phoneNumber} className="hover:bg-slate-50 group">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                            {user.fullName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{user.fullName}</p>
                            <p className="text-xs text-slate-500">ID: {userId ? `${userId.slice(0, 8)}...` : 'N/A'}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                    {user.age ? `${user.age} yrs` : 'N/A'}
                </td>
                <td className="px-6 py-4 font-mono text-slate-600 text-sm">
                    {user.phoneNumber}
                </td>
                <td className="px-6 py-4">
                    {user.isSafe ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                            <Shield className="w-4 h-4" /> <span className="text-xs font-bold">Safe</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full w-fit animate-pulse">
                            <ShieldAlert className="w-4 h-4" /> <span className="text-xs font-bold">SOS</span>
                        </div>
                    )}
                </td>
                <td className="px-6 py-4">
                    {/* Mock Device Data since we don't have real telemetry in User table yet */}
                    <div className="flex items-center gap-2">
                        <Battery className={`w-5 h-5 text-green-500`} />
                        <span className="text-xs font-mono">98%</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
