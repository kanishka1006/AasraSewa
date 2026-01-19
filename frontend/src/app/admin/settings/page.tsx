"use client";

import { Save, Bell, Shield, Server, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold text-slate-800">System Settings</h1>
            <p className="text-slate-500">Configure alerts, thresholds, and infrastructure</p>
         </div>
         <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800">
            <Save className="w-4 h-4" /> Save Changes
         </button>
      </div>

      <div className="grid gap-8">
        {/* Alert Thresholds */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <Bell className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Alert Thresholds</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">High Heart Rate (BPM)</label>
                    <input type="number" defaultValue={120} className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-slate-400">Trigger Alert if HR exceeds this value</p>
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Low Oxygen (SpO2 %)</label>
                    <input type="number" defaultValue={90} className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                     <p className="text-xs text-slate-400">Trigger Alert if SpO2 falls below this value</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Fall Detection Sensitivity</label>
                    <select className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Low (Hard Impact Only)</option>
                        <option selected>Medium (Standard)</option>
                        <option>High (Sensitive)</option>
                    </select>
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Silent Zone Radius (meters)</label>
                    <input type="number" defaultValue={50} className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
        </section>

        {/* System Health */}
         <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Server className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Infrastructure</h2>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-4">
                         <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                             <Database className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="font-semibold text-slate-800">PostgreSQL Database</p>
                             <p className="text-xs text-green-600">● Operational (Latency: 24ms)</p>
                         </div>
                    </div>
                    <button className="text-blue-600 font-medium text-sm hover:underline">View Logs</button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-4">
                         <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                             <Shield className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="font-semibold text-slate-800">AI Risk Engine</p>
                             <p className="text-xs text-green-600">● Online (v2.4 Model loaded)</p>
                         </div>
                    </div>
                     <button className="text-blue-600 font-medium text-sm hover:underline">Configure Model</button>
                </div>
            </div>
         </section>
      </div>
    </div>
  );
}
