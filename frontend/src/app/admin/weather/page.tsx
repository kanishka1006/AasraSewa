"use client";

import { useEffect, useState } from "react";
import { CloudRain, Sun, Wind, Droplets } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";

/** Demo places with fixed coords (Open-Meteo geocoder often misses Indian place names). */
const KNOWN_LOCATIONS: { label: string; latitude: number; longitude: number; name: string; country: string }[] = [
    // Same Katra pin as User band demo (Vaishno Devi Bhawan area)
    { label: "Katra, Vaishno Devi", latitude: 33.0297, longitude: 74.9486, name: "Katra (Vaishno Devi)", country: "India" },
    { label: "Katra, Jammu", latitude: 32.99167, longitude: 74.93195, name: "Katra", country: "India" },
    { label: "Sector 4, Rohini", latitude: 28.7495, longitude: 77.0565, name: "Rohini Sector 4", country: "India" },
    { label: "Jammu City", latitude: 32.7266, longitude: 74.857, name: "Jammu", country: "India" },
];

function resolvePlace(location: string) {
    const q = location.trim().toLowerCase();
    if (!q) return null;
    if (q.includes("vaishno") || q === "katra" || q.startsWith("katra,")) return KNOWN_LOCATIONS[0];
    const exact = KNOWN_LOCATIONS.find(p => p.label.toLowerCase() === q);
    if (exact) return exact;
    if (q.includes("rohini")) return KNOWN_LOCATIONS[2];
    if (q.includes("jammu")) return KNOWN_LOCATIONS[3];
    return null;
}

// Real Weather Service using OpenMeteo (Free, No Key Required)
const fetchWeatherPrediction = async (location: string) => {
    try {
        let latitude: number;
        let longitude: number;
        let name: string;
        let country: string;

        const pinned = resolvePlace(location);
        if (pinned) {
            ({ latitude, longitude, name, country } = pinned);
        } else {
            // Geocoding: prefer India when searching free text
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5&language=en&format=json&countryCode=IN`
            );
            const geoData = await geoRes.json();
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error("Location not found");
            }
            // Prefer Jammu & Kashmir hit when query mentions Katra
            const pick = location.toLowerCase().includes("katra")
                ? (geoData.results.find((r: any) => /jammu|kashmir|reasi/i.test(`${r.admin1 || ""} ${r.name || ""}`)) || geoData.results[0])
                : geoData.results[0];
            latitude = pick.latitude;
            longitude = pick.longitude;
            name = pick.name;
            country = pick.country || "India";
        }

        // Weather forecast for resolved coordinates
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m&hourly=temperature_2m,rain,weather_code&forecast_days=1`
        );
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current;
        const currentTemp = Math.round(current.temperature_2m);
        
        // Helper to interpret WMO codes
        const getWeatherCondition = (code: number) => {
            if (code <= 3) return "Clear/Cloudy";
            if (code <= 48) return "Foggy";
            if (code <= 67) return "Rainy";
            if (code <= 77) return "Snowy";
            if (code <= 82) return "Heavy Rain";
            return "Stormy";
        };

        const condition = getWeatherCondition(weatherData.hourly.weather_code[0]);
        const riskLevel = (current.rain > 5 || current.wind_speed_10m > 50) ? "HIGH" : "LOW";

        const summary = riskLevel === 'HIGH' 
            ? `Alert: Adverse conditions detected in ${name}. High wind/rain may impact rescue protocols.`
            : `Conditions in ${name}, ${country} are stable. Optimal for drone and ground team deployment.`;

        return {
            current: {
                temp: currentTemp,
                condition: condition,
                humidity: current.relative_humidity_2m,
                wind: Math.round(current.wind_speed_10m * 10) / 10
            },
            forecast: [0, 1, 2, 3, 4].map(offset => {
                const hourIndex = new Date().getHours() + offset;
                const safeIndex = hourIndex % 24; 
                
                const rain = weatherData.hourly.rain[safeIndex];
                const code = weatherData.hourly.weather_code[safeIndex];
                
                let alert = undefined;
                if (rain > 2) alert = "Rain Expected";
                if (code > 80) alert = "Storm Warning";

                return {
                    time: offset === 0 ? "Now" : `+${offset}hr`,
                    temp: Math.round(weatherData.hourly.temperature_2m[safeIndex]),
                    rainChance: Math.min(rain * 10, 100),
                    alert: alert
                };
            }),
            riskLevel: riskLevel,
            summary: summary,
            place: { name, latitude, longitude }
        };

    } catch (error) {
        console.error("Weather API Error:", error);
         return {
            current: { temp: 22, condition: "Unknown", humidity: 50, wind: 10 },
            forecast: [],
            riskLevel: "LOW",
            summary: `Could not fetch real-time data for ${location}. displaying fallback values.`
        };
    }
};

export default function WeatherPage() {
  const [location, setLocation] = useState("Katra, Vaishno Devi");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
      const place = location.trim();
      if (!place) {
          setData(null);
          setLoading(false);
          return;
      }
      let cancelled = false;
      setLoading(true);
      const timer = setTimeout(async () => {
          const result = await fetchWeatherPrediction(place);
          if (!cancelled) {
              setData(result);
              setLoading(false);
          }
      }, 400);
      return () => {
          cancelled = true;
          clearTimeout(timer);
      };
  }, [location]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">AI Weather Prediction</h1>
          <p className="text-slate-500 mt-1">Real-time localized forecasting for mission planning</p>
        </div>
        
        <div className="flex flex-col gap-2 w-full md:w-auto">
        <div className="flex flex-wrap gap-2">
            {KNOWN_LOCATIONS.map(place => (
                <button
                    key={place.label}
                    type="button"
                    onClick={() => setLocation(place.label)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        location === place.label
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    }`}
                >
                    {place.label}
                </button>
            ))}
        </div>
        <div className="flex bg-white shadow-md hover:shadow-lg transition-shadow p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
            <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="px-4 py-3 outline-none bg-transparent w-full md:w-80 text-lg text-slate-700 placeholder:text-slate-400"
                placeholder="Katra, Vaishno Devi..."
            />
            <button
                onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                        setData({
                            current: { temp: 19, condition: "Severe Cyclone", humidity: 98, wind: 85 },
                            forecast: [
                                { time: "Now", temp: 19, rainChance: 100, alert: "Cyclone" },
                                { time: "+1hr", temp: 18, rainChance: 100, alert: "Flooding" },
                                { time: "+2hr", temp: 18, rainChance: 95, alert: "Critical" },
                                { time: "+3hr", temp: 18, rainChance: 90 },
                                { time: "+4hr", temp: 17, rainChance: 80 },
                            ],
                            riskLevel: "HIGH",
                            summary: "SIMULATION: Category 3 Storm system detected over sector. Immediate mobilization required."
                        });
                        setLoading(false);
                    }, 800);
                }}
                disabled={loading}
                className="bg-slate-100 text-slate-700 px-4 py-3 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                title="Force High Risk Scenario"
            >
                <CloudRain className="w-5 h-5 text-slate-500" /> Test Alert
            </button>
        </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading && !data && (
             <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"
            >
                 <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                 <p className="text-lg font-medium">Loading forecast for {location}</p>
             </motion.div>
        )}

        {!data && !loading && (
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"
            >
                 <CloudRain className="w-16 h-16 mb-4 opacity-30" />
                 <p className="text-lg font-medium">Enter a location to see the forecast</p>
             </motion.div>
        )}

        {data && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Main Insight Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 opacity-80">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="uppercase tracking-widest text-sm font-bold">{location}</span>
                                    </div>
                                    <h2 className="text-6xl font-bold mb-2 tracking-tighter">{data.current.temp}°</h2>
                                    <p className="text-blue-100 font-medium text-xl flex items-center gap-2">
                                        <CloudRain className="w-6 h-6" /> {data.current.condition}
                                    </p>
                                </div>
                                <div className={`
                                    px-4 py-2 rounded-xl text-sm font-bold border-2 backdrop-blur-md
                                    ${data.riskLevel === 'HIGH' ? 'bg-red-500/30 border-red-400 text-white' : 'bg-green-500/30 border-green-400 text-white'}
                                `}>
                                    RISK LEVEL: {data.riskLevel}
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                <p className="text-blue-50 text-lg leading-relaxed">
                                    "{data.summary}"
                                </p>
                            </div>
                        </div>
                        
                        {/* Decorative Background Icon */}
                        <CloudRain className="absolute -right-10 -bottom-10 w-80 h-80 text-white/5 rotate-12" />
                        
                        {/* ALERT BUTTON: Only show if HIGH RISK */}
                        {data.riskLevel === 'HIGH' && (
                            <div className="absolute top-6 right-6 z-20">
                                <button 
                                    onClick={async () => { 
                                        const alertObj = {
                                            id: `W-${Math.floor(Math.random()*1000)}`,
                                            type: "Severe Weather",
                                            location: location,
                                            priority: "CRITICAL",
                                            time: "Just Now",
                                            details: data.summary
                                        };
                                        
                                        try {
                                             await fetch(apiUrl("/alerts"), {
                                                 method: 'POST',
                                                 headers: { 'Content-Type': 'application/json' },
                                                 body: JSON.stringify(alertObj)
                                             });
                                             alert("🚨 Alert Dispatched to Rescue Teams (Backend)!");
                                        } catch(e) {
                                            console.error(e);
                                            alert("Failed to send alert to backend");
                                        }
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg animate-pulse flex items-center gap-2"
                                >
                                    <Wind className="w-5 h-5" /> DISPATCH TEAM
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-rows-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Wind Speed</p>
                                <h3 className="text-2xl font-bold text-slate-800">{data.current.wind} <span className="text-sm text-slate-400 font-normal">km/h</span></h3>
                            </div>
                            <div className="p-3 bg-slate-100 rounded-full text-slate-600">
                                <Wind className="w-6 h-6" />
                            </div>
                        </div>
                         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Humidity</p>
                                <h3 className="text-2xl font-bold text-slate-800">{data.current.humidity}<span className="text-sm text-slate-400 font-normal">%</span></h3>
                            </div>
                            <div className="p-3 bg-slate-100 rounded-full text-slate-600">
                                <Droplets className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">4-Hour Forecast Trajectory</h3>
                    <div className="grid grid-cols-5 gap-4">
                        {data.forecast.map((f: any, i: number) => (
                            <div key={i} className={`
                                text-center p-4 rounded-xl border relative overflow-hidden transition-all
                                ${f.alert ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}
                            `}>
                                <p className="text-xs font-semibold text-slate-500 mb-2">{f.time}</p>
                                <div className="mb-2 flex justify-center text-slate-700">
                                    {f.rainChance > 50 ? <CloudRain className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                                </div>
                                <p className="font-bold text-slate-800">{f.temp}°</p>
                                <p className="text-xs text-slate-400 mt-1">{f.rainChance}% Rain</p>
                                
                                {f.alert && (
                                    <div className="absolute top-0 left-0 w-full bg-red-500 text-[10px] text-white font-bold py-0.5">
                                        ALERT
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
