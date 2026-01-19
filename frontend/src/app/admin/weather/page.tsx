"use client";

import { useState } from "react";
import { CloudRain, Sun, Wind, Thermometer, Droplets, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Real Weather Service using OpenMeteo (Free, No Key Required)
const fetchWeatherPrediction = async (location: string) => {
    try {
        // 1. Geocoding: Get Lat/Lon for location
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
             throw new Error("Location not found");
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Weather: Get Forecast
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m&hourly=temperature_2m,rain,weather_code&forecast_days=1`
        );
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current;
        const currentTemp = Math.round(current.temperature_2m);
        const isRaining = current.rain > 0;
        
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

        // Generate Resume
        const summary = riskLevel === 'HIGH' 
            ? `Alert: Adverse conditions detected in ${name}. High wind/rain may impact rescue protocols.`
            : `Conditions in ${name}, ${country} are stable. Optimal for drone and ground team deployment.`;

        // 3. Format Response
        return {
            current: {
                temp: currentTemp,
                condition: condition,
                humidity: current.relative_humidity_2m,
                wind: current.wind_speed_10m
            },
            forecast: [0, 1, 2, 3, 4].map(offset => {
                const hourIndex = new Date().getHours() + offset;
                 // Loop if end of day (simple hack for demo)
                const safeIndex = hourIndex % 24; 
                
                const rain = weatherData.hourly.rain[safeIndex];
                const code = weatherData.hourly.weather_code[safeIndex];
                
                let alert = undefined;
                if (rain > 2) alert = "Rain Expected";
                if (code > 80) alert = "Storm Warning";

                return {
                    time: offset === 0 ? "Now" : `+${offset}hr`,
                    temp: Math.round(weatherData.hourly.temperature_2m[safeIndex]),
                    rainChance: Math.min(rain * 10, 100), // Approx conversion
                    alert: alert
                };
            }),
            riskLevel: riskLevel,
            summary: summary
        };

    } catch (error) {
        console.error("Weather API Error:", error);
         // Fallback to Mock if API fails (e.g. rate limit or bad location)
         return {
            current: { temp: 22, condition: "Unknown", humidity: 50, wind: 10 },
            forecast: [],
            riskLevel: "LOW",
            summary: `Could not fetch real-time data for ${location}. displaying fallback values.`
        };
    }
};

export default function WeatherPage() {
  const [location, setLocation] = useState("Sector 4, Rohini");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handlePredict = async () => {
      setLoading(true);
      const result = await fetchWeatherPrediction(location);
      setData(result);
      setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">AI Weather Prediction</h1>
          <p className="text-slate-500 mt-1">Real-time localized forecasting for mission planning</p>
        </div>
        
        <div className="flex bg-white shadow-md hover:shadow-lg transition-shadow p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
            <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="px-4 py-3 outline-none bg-transparent w-full md:w-80 text-lg text-slate-700 placeholder:text-slate-400"
                placeholder="Enter Sector or Coordinates..."
            />
            <button 
                onClick={handlePredict}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
                {loading ? (
                    <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     Analyzing...
                    </>
                ) : (
                    <>Generate <ArrowRight className="w-5 h-5" /></>
                )}
            </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!data && !loading && (
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"
            >
                 <CloudRain className="w-16 h-16 mb-4 opacity-30" />
                 <p className="text-lg font-medium">Enter a location above to generate a micro-weather forecast</p>
                 <p className="text-sm opacity-60">Try "Sector 4", "Yamuna Bank", or "Connaught Place"</p>
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
