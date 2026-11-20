"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertTriangle, ArrowRight, X, MapPin, Thermometer, Users, HeartPulse, ShieldAlert, Bot } from "lucide-react";
import dynamic from "next/dynamic";
import { apiUrl } from "@/lib/api";

// Reuse the LiveMap for the Heatmap visualization for now
const LiveMap = dynamic(() => import("@/components/Map/LiveMap"), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-xl"></div>,
});

type MissionKind = "Health" | "Stampede" | "Weather";

const YATRA_SITES: Record<MissionKind, { lat: number; lon: number; address: string }> = {
  Health: { lat: 33.0165, lon: 74.956, address: "Adhkuwari, Vaishno Devi" },
  Stampede: { lat: 33.0297, lon: 74.9486, address: "Bhawan, Vaishno Devi" },
  Weather: { lat: 34.0915, lon: 75.4965, address: "Sheshnag, Amarnath Yatra" },
};

const MISSION_COPY: Record<MissionKind, {
  title: string;
  team: string;
  priority: string;
  aiType: string;
  situation: (address: string) => string;
  fallback: string;
  dispatch: string;
}> = {
  Health: {
    title: "Health Emergency",
    team: "Medical Response",
    priority: "CRITICAL",
    aiType: "Health Emergency",
    situation: (address) => `Pilgrim medical emergency at ${address}. Immediate first aid and evacuation required.`,
    fallback: "1. Reach the patient and check airway, breathing, and circulation\n2. Give oxygen and treat altitude or cardiac distress\n3. Evacuate to the nearest medical post\n4. Keep a clear corridor for the stretcher team",
    dispatch: "Dispatch Medical Team",
  },
  Stampede: {
    title: "Stampede",
    team: "Crowd Control",
    priority: "CRITICAL",
    aiType: "Stampede / Crowd Control",
    situation: (address) => `High crowd density detected at ${address}. Potential stampede risk. Immediate crowd control required.`,
    fallback: "1. Establish a perimeter\n2. Open egress routes\n3. Triage crush injuries\n4. Set an incident command post",
    dispatch: "Dispatch Crowd Control",
  },
  Weather: {
    title: "Weather Alert",
    team: "Weather Response",
    priority: "CRITICAL",
    aiType: "Severe Weather",
    situation: (address) => `Severe weather on the yatra route at ${address}. Pilgrims need shelter and the track may need to close.`,
    fallback: "1. Halt movement on the exposed track\n2. Move pilgrims into the nearest shelter\n3. Watch wind, rain, and landslide risk\n4. Keep a medical team on standby",
    dispatch: "Dispatch Weather Team",
  },
};

function crowdAround(lat: number, lon: number) {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `CROWD-${i}`,
    name: "Detected Person",
    lat: lat + (Math.random() - 0.5) * 0.005,
    lon: lon + (Math.random() - 0.5) * 0.005,
    sos: Math.random() > 0.8,
    role: "CITIZEN" as const,
    lastUpdate: new Date().toISOString(),
  }));
}

async function resolveLocation(kind: MissionKind) {
  const fallback = YATRA_SITES[kind];
  if (typeof navigator === "undefined" || !navigator.geolocation) return fallback;
  const position = await new Promise<GeolocationPosition | null>((resolve) => {
    let settled = false;
    const finish = (value: GeolocationPosition | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); finish(pos); },
      () => { clearTimeout(timer); finish(null); },
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 120000 },
    );
  });
  if (!position) return fallback;
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    const address = data.display_name
      ? data.display_name.split(",").slice(0, 3).join(",")
      : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    return { lat, lon, address };
  } catch {
    return { lat, lon, address: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
  }
}

export default function RescuePage() {
  const [activeTab, setActiveTab] = useState("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStampedeMap, setShowStampedeMap] = useState(false);
  const [draftType, setDraftType] = useState<MissionKind | null>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  
  const [missionLocation, setMissionLocation] = useState<{lat: number, lon: number, address: string} | null>(null);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [missions, setMissions] = useState<any[]>([
    { id: "RES-101", type: "Medical", location: "Sector 4, Rohini", status: "In Progress", priority: "High", time: "2 mins ago", team: "Team Alpha", details: "Medical evacuation request.", aiAnalysis: null },
    { id: "RES-098", type: "Fire", location: "Industrial Area, Okhla", status: "Dispatched", priority: "Critical", time: "15 mins ago", team: "Team Bravo", details: "Warehouse fire reported.", aiAnalysis: null },
    { id: "RES-095", type: "Flood", location: "Yamuna Bank", status: "Resolved", priority: "Medium", time: "2 hours ago", team: "Team Charlie", details: "Flood water rising.", aiAnalysis: null },
  ]);
  const [selectedMission, setSelectedMission] = useState<any | null>(null);

  // Pull dispatched stampede alerts (with AI plan) from the API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(apiUrl("/alerts"));
        if (!res.ok) return;
        const alerts = await res.json();
        if (!Array.isArray(alerts) || alerts.length === 0) return;
        setMissions(prev => {
          const ids = new Set(prev.map(m => m.id));
          const incoming = alerts
            .filter((a: any) => a?.id && !ids.has(a.id))
            .map((a: any) => ({
              id: a.id,
              type: a.type || "Stampede",
              location: a.location || "Unknown",
              status: "Dispatched",
              priority: a.priority || "Critical",
              time: a.time || "Just now",
              team: "Crowd Control",
              details: a.details || "",
              aiAnalysis: a.aiAnalysis || null,
            }));
          // Refresh AI plan on missions we already have
          const refreshed = prev.map(m => {
            const match = alerts.find((a: any) => a.id === m.id);
            if (!match) return m;
            return { ...m, details: match.details || m.details, aiAnalysis: match.aiAnalysis ?? m.aiAnalysis };
          });
          return incoming.length ? [...incoming, ...refreshed] : refreshed;
        });
      } catch (e) {
        console.error("Failed to load alerts", e);
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const handleCreateMission = async (type: MissionKind) => {
      const copy = MISSION_COPY[type];
      setDraftType(type);
      setShowStampedeMap(true);
      setAiAnalysis(null);
      setIsAnalyzing(true);

      const site = await resolveLocation(type);
      setMissionLocation(site);
      const points = type === "Stampede"
        ? crowdAround(site.lat, site.lon)
        : [{
            id: `${type}-PIN`,
            name: copy.title,
            lat: site.lat,
            lon: site.lon,
            sos: type === "Health",
            role: "CITIZEN" as const,
            placeName: site.address,
            lastUpdate: new Date().toISOString(),
          }];
      setHeatmapData(points);

      let weatherInfo = "Unknown Weather";
      try {
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${site.lat}&longitude=${site.lon}&current_weather=true`);
          const weatherData = await weatherRes.json();
          const temperature = weatherData.current_weather?.temperature;
          const wind = weatherData.current_weather?.windspeed;
          if (Number.isFinite(temperature)) weatherInfo = `${temperature}°C, Wind ${wind}km/h`;
      } catch (error) {
          console.error("Weather lookup failed", error);
      }

      const aiAbort = new AbortController();
      const aiTimer = setTimeout(() => aiAbort.abort(), 12000);
      try {
          const aiRes = await fetch(apiUrl("/gemini/analyze"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: aiAbort.signal,
              body: JSON.stringify({
                  type: copy.aiType,
                  location: site.address,
                  weather: weatherInfo,
                  details: copy.situation(site.address),
              }),
          });
          if (!aiRes.ok) throw new Error(`AI HTTP ${aiRes.status}`);
          const aiData = await aiRes.json();
          setAiAnalysis(aiData.analysis || copy.fallback);
      } catch (error) {
          console.error("AI Error", error);
          setAiAnalysis(copy.fallback);
      } finally {
          clearTimeout(aiTimer);
          setIsAnalyzing(false);
      }
  };

  const dispatchMission = async () => {
      if (!draftType || !missionLocation) return;
      const copy = MISSION_COPY[draftType];
      const points = heatmapData.length > 0 ? heatmapData : [{
          id: `${draftType}-PIN`,
          name: copy.title,
          lat: missionLocation.lat,
          lon: missionLocation.lon,
          sos: draftType === "Health",
          role: "CITIZEN",
          placeName: missionLocation.address,
          lastUpdate: new Date().toISOString(),
      }];
      const payload = {
          id: `RES-${draftType.slice(0, 3).toUpperCase()}-${Date.now()}`,
          type: copy.title,
          priority: copy.priority,
          location: missionLocation.address,
          time: "Just Now",
          details: copy.situation(missionLocation.address),
          heatmapData: points,
          aiAnalysis,
      };

      try {
          const res = await fetch(apiUrl("/alerts"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
          });
          if (!res.ok) {
              alert(`Failed to dispatch alert. Server responded: ${res.status} ${res.statusText}`);
              return;
          }
          setMissions(prev => [{
              id: payload.id,
              type: copy.title,
              location: payload.location,
              status: "Dispatched",
              priority: "Critical",
              time: "Just now",
              team: copy.team,
              details: payload.details,
              aiAnalysis: payload.aiAnalysis,
          }, ...prev]);
          setIsModalOpen(false);
          setShowStampedeMap(false);
          setDraftType(null);
          setAiAnalysis(null);
          setHeatmapData([]);
          alert(`${copy.title} dispatched to the Rescue Portal at http://localhost:3003`);
      } catch (error) {
          console.error("Dispatch Error", error);
          alert("Network error: the mission could not reach the rescue portal.");
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
                      ${m.type === 'Medical' || m.type === 'Health Emergency' ? 'bg-red-50 text-red-600' : ''}
                      ${m.type === 'Fire' ? 'bg-orange-50 text-orange-600' : ''}
                      ${m.type === 'Flood' || m.type === 'Weather Alert' ? 'bg-blue-50 text-blue-600' : ''}
                      ${m.type === 'Stampede' ? 'bg-amber-50 text-amber-700' : ''}
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
                  <button
                    type="button"
                    onClick={() => setSelectedMission(m)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mission Details + AI Plan */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Mission Details</h2>
                <p className="text-sm text-slate-500 font-mono">{selectedMission.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Type</span><p className="font-semibold text-slate-800">{selectedMission.type}</p></div>
                <div><span className="text-slate-400">Status</span><p className="font-semibold text-slate-800">{selectedMission.status}</p></div>
                <div className="col-span-2"><span className="text-slate-400">Location</span><p className="font-semibold text-slate-800">{selectedMission.location}</p></div>
                <div><span className="text-slate-400">Team</span><p className="font-semibold text-slate-800">{selectedMission.team}</p></div>
                <div><span className="text-slate-400">Priority</span><p className="font-semibold text-slate-800">{selectedMission.priority || "—"}</p></div>
              </div>
              {selectedMission.details && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Situation</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedMission.details}</p>
                </div>
              )}
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                <div className="flex items-center gap-2 text-indigo-800 mb-2">
                  <Bot className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase">AI Tactical Plan</p>
                </div>
                {selectedMission.aiAnalysis ? (
                  <p className="text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">{selectedMission.aiAnalysis}</p>
                ) : (
                  <p className="text-sm text-indigo-600/80">
                    No AI plan stored for this mission. Stampede missions show the plan after Dispatch (also on Rescue Portal :3003).
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-white">
              <a
                href="http://localhost:3003"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg"
              >
                Open Rescue Portal
              </a>
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Mission Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h2 className="text-xl font-bold text-slate-800">Create New Mission</h2>
                      <button onClick={() => { setIsModalOpen(false); setShowStampedeMap(false); setDraftType(null); }} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  {!showStampedeMap ? (
                      <div className="p-8">
                        <p className="text-slate-500 mb-6 font-medium">Select the type of emergency to configure response:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* Health Emergency */}
                            <button 
                                onClick={() => handleCreateMission("Health")}
                                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <HeartPulse className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-slate-700 group-hover:text-red-700">Health Emergency</span>
                            </button>

                            {/* Stampede */}
                            <button 
                                onClick={() => handleCreateMission("Stampede")}
                                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-slate-100 hover:border-amber-100 hover:bg-amber-50 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="w-8 h-8" />
                                </div>
                                <span className="font-bold text-slate-700 group-hover:text-amber-700">Stampede Alert</span>
                            </button>

                            {/* Weather Alert */}
                            <button 
                                onClick={() => handleCreateMission("Weather")}
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
                          <div className={`px-6 py-3 border-b flex items-center justify-between shrink-0 ${draftType === "Health" ? "bg-red-50 border-red-100 text-red-800" : draftType === "Weather" ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-amber-50 border-amber-100 text-amber-800"}`}>
                              <div className="flex items-center gap-2">
                                  <ShieldAlert className="w-5 h-5 animate-pulse" /> 
                                  <span className="font-bold">{draftType ? MISSION_COPY[draftType].title : "Mission"} · {missionLocation?.address || "Locating..."}</span>
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
                              <button onClick={() => { setIsModalOpen(false); setDraftType(null); }} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                              <button 
                                onClick={dispatchMission}
                                disabled={isAnalyzing || !missionLocation}
                                className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${
                                    isAnalyzing || !missionLocation
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30'
                                }`}
                              >
                                  {isAnalyzing ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                                        Preparing plan...
                                      </>
                                  ) : (
                                      <>
                                        <AlertTriangle className="w-4 h-4" /> {draftType ? MISSION_COPY[draftType].dispatch : "Dispatch"}
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
