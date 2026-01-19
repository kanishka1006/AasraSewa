"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertTriangle, ArrowRight, X, MapPin, Thermometer, Users, HeartPulse, ShieldAlert, Bot } from "lucide-react";
import dynamic from "next/dynamic";

// Reuse the LiveMap for the Heatmap visualization for now
const LiveMap = dynamic(() => import("@/components/Map/LiveMap"), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-xl"></div>,
});

export default function RescuePage() {
  const [activeTab, setActiveTab] = useState("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStampedeMap, setShowStampedeMap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  
  const [missionLocation, setMissionLocation] = useState<{lat: number, lon: number, address: string} | null>(null);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const missions = [
    { id: "RES-101", type: "Medical", location: "Sector 4, Rohini", status: "In Progress", priority: "High", time: "2 mins ago", team: "Team Alpha" },
    { id: "RES-098", type: "Fire", location: "Industrial Area, Okhla", status: "Dispatched", priority: "Critical", time: "15 mins ago", team: "Team Bravo" },
    { id: "RES-095", type: "Flood", location: "Yamuna Bank", status: "Resolved", priority: "Medium", time: "2 hours ago", team: "Team Charlie" },
  ];

  const handleCreateMission = (type: string) => {
      if (type === 'Stampede') {
          // Trigger "Near Me" Heatmap Logic
          if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(async (pos) => {
                  const { latitude, longitude } = pos.coords;
                  
                  // Generate visual crowd
                  generateCrowdData(latitude, longitude);

                  // Fetch Address
                  let address = "Unknown Location";
                  let weatherInfo = "Unknown Weather";
                  
                  try {
                       const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                       const data = await res.json();
                       address = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                       
                       // Fetch Weather
                       const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                       const weatherData = await weatherRes.json();
                       const t = weatherData.current_weather?.temperature;
                       const w = weatherData.current_weather?.windspeed;
                       weatherInfo = `${t}°C, Wind ${w}km/h`;
                  } catch (e) {
                      address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                      console.error("Fetch Error", e);
                  }

                  const locationData = { lat: latitude, lon: longitude, address: address };
                  setMissionLocation(locationData);
                  setShowStampedeMap(true);

                  // TRIGGER AI ANALYSIS
                  setIsAnalyzing(true);
                  try {
                      const aiRes = await fetch('http://localhost:3001/gemini/analyze', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              type: 'Stampede / Crowd Control',
                              location: address,
                              weather: weatherInfo,
                              details: 'High density crowd detected. Potential for crush injuries. Urgent automated dispatch.'
                          }) 
                      });
                      const aiData = await aiRes.json();
                      setAiAnalysis(aiData.analysis);
                  } catch (e) {
                      console.error("AI Error", e);
                      setAiAnalysis("AI Connectivity Failed. Proceed with Standard Protocols.");
                  } finally {
                      setIsAnalyzing(false);
                  }

              }, (err) => {
                  console.error("Geo Error", err);
                  alert("Could not detect location. Please allow permissions.");
              });
          } else {
              alert("Location needed for Heatmap");
          }
      } else {
          alert(`Created ${type} Alert (Simulation)`);
          setIsModalOpen(false);
      }
  };

  const generateCrowdData = (lat: number, lon: number) => {
      // Generate 50 mock users around the center to simulate a crowd
      const crowd = [];
      for(let i=0; i<50; i++) {
          crowd.push({
              id: `CROWD-${i}`,
              name: 'Detected Person',
              lat: lat + (Math.random() - 0.5) * 0.005, // Tight cluster
              lon: lon + (Math.random() - 0.5) * 0.005,
              sos: Math.random() > 0.8, // 20% panic rate
              role: 'CITIZEN',
              lastUpdate: new Date().toISOString()
          });
      }
      setHeatmapData(crowd);
  };

  const dispatchStampedeAlert = async () => {
      console.log("Dispatching Alert...", heatmapData.length);
      
      if (heatmapData.length === 0) {
          alert("Error: No crowd data to dispatch. Simulation may have failed.");
          return;
      }

      const payload = {
          id: `RES-STAMP-${Date.now()}`,
          type: 'Stampede',
          priority: 'CRITICAL',
          location: missionLocation?.address || 'Live Location (Crowd Detected)',
          time: 'Just Now',
          details: `High crowd density detected at ${missionLocation?.address || 'Unknown'}. Potential stampede risk. Immediate crowd control required.`,
          heatmapData: heatmapData,
          aiAnalysis: aiAnalysis // Send AI plan to rescue teams
      };

      try {
          console.log("Payload:", payload);
          const res = await fetch('http://localhost:3001/alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              const responseData = await res.json();
              console.log("Server Response:", responseData);
              alert(`🚨 Stampede Alert Dispatched for ${missionLocation?.address}!`);
              setIsModalOpen(false);
              setShowStampedeMap(false);
              setAiAnalysis(null); // Reset
          } else {
              const errText = await res.text();
              console.error("Server Error:", errText);
              alert(`Failed to dispatch alert. Server responded: ${res.status} ${res.statusText}`);
          }
      } catch (error) {
          console.error("Dispatch Error", error);
          alert(`Network Error: Could not dispatch. check console for details.`);
      }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Rescue Operations</h1>
          <p className="text-slate-500">Manage and tracking active emergency response teams</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
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

      {/* New Mission Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h2 className="text-xl font-bold text-slate-800">Create New Mission</h2>
                      <button onClick={() => { setIsModalOpen(false); setShowStampedeMap(false); }} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  {!showStampedeMap ? (
                      <div className="p-8">
                        <p className="text-slate-500 mb-6 font-medium">Select the type of emergency to configure response:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* Health Emergency */}
                            <button 
                                onClick={() => handleCreateMission('Health')}
                                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <HeartPulse className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-slate-700 group-hover:text-red-700">Health Emergency</span>
                            </button>

                            {/* Stampede */}
                            <button 
                                onClick={() => handleCreateMission('Stampede')}
                                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-slate-100 hover:border-amber-100 hover:bg-amber-50 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-slate-700 group-hover:text-amber-700">Stampede Alert</span>
                            </button>

                            {/* Weather Alert */}
                            <button 
                                onClick={() => handleCreateMission('Weather')}
                                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-slate-100 hover:border-blue-100 hover:bg-blue-50 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Thermometer className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-slate-700 group-hover:text-blue-700">Weather Alert</span>
                            </button>
                        </div>
                      </div>
                  ) : (
                      <div className="flex flex-col h-[80vh]">
                          {/* Fixed Header */}
                          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-2 text-amber-800">
                                  <ShieldAlert className="w-5 h-5 animate-pulse" /> 
                                  <span className="font-bold">Crowd Density Simulation Detected</span>
                              </div>
                              <button onClick={() => setShowStampedeMap(false)} className="text-sm font-medium text-slate-500 hover:text-slate-800 underline">Back</button>
                          </div>
                          
                          {/* Scrollable Content Body */}
                          <div className="flex-1 overflow-y-auto">
                              {/* AI Analysis Panel */}
                              <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100">
                                 <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-indigo-800 text-sm mb-1 uppercase">AI Tactical Advisor</h4>
                                        {isAnalyzing ? (
                                            <div className="flex items-center gap-2 text-indigo-600 text-sm animate-pulse">
                                                <span>Analyzing scenario...</span>
                                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-indigo-700 whitespace-pre-wrap leading-relaxed font-medium">
                                                {aiAnalysis || "Pending Analysis..."}
                                            </p>
                                        )}
                                    </div>
                                 </div>
                              </div>

                              <div className="relative bg-slate-100 min-h-[400px] h-full">
                                  {/* Using LiveMap to simulate heatmap - passing high density of users */}
                                  {/* @ts-ignore */}
                                  <LiveMap users={heatmapData} />
                              </div>
                          </div>

                          {/* Fixed Footer */}
                          {/* Fixed Footer */}
                          <div className="p-4 bg-white border-t flex justify-end gap-3 shrink-0">
                              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                              <button 
                                onClick={dispatchStampedeAlert}
                                disabled={isAnalyzing}
                                className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${
                                    isAnalyzing 
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30'
                                }`}
                              >
                                  {isAnalyzing ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                        Wait for AI...
                                      </>
                                  ) : (
                                      <>
                                        <AlertTriangle className="w-4 h-4" /> Dispatch Crowd Control
                                      </>
                                  )}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
}
