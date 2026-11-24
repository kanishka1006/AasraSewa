"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiBase, authFetch } from "@/lib/api";

const LiveMap = dynamic(() => import("@/components/Map/LiveMap"), { ssr: false });

type Reading = {
  userId: string; userName: string; bandId: string;
  lat: number; lon: number; ts: string; sos: boolean; source: string;
  heartRate?: number; spO2?: number; temperature?: number; batteryLevel?: number;
  role?: "CITIZEN" | "VOLUNTEER";
  place?: string;
};

const YATRA_BANDS: Omit<Reading, "ts">[] = [
  { userId: "band-01", userName: "Anjali Sharma", bandId: "AA:01:VD:KATRA", lat: 32.9917, lon: 74.9319, sos: false, source: "Band No: 01", role: "CITIZEN", place: "Katra, Vaishno Devi", heartRate: 78, spO2: 98, temperature: 36.6, batteryLevel: 91 },
  { userId: "band-02", userName: "Ravi Kumar", bandId: "AA:02:VD:BANGA", lat: 33.0012, lon: 74.9465, sos: false, source: "Band No: 02", role: "VOLUNTEER", place: "Banganga, Vaishno Devi", heartRate: 74, spO2: 97, temperature: 36.4, batteryLevel: 88 },
  { userId: "band-03", userName: "Meera Devi", bandId: "AA:03:VD:ADHKU", lat: 33.0165, lon: 74.9560, sos: true, source: "Band No: 03", role: "CITIZEN", place: "Adhkuwari, Vaishno Devi", heartRate: 112, spO2: 93, temperature: 37.4, batteryLevel: 64 },
  { userId: "band-04", userName: "Imran Bhat", bandId: "AA:04:AM:PAHAL", lat: 34.0161, lon: 75.3150, sos: false, source: "Band No: 04", role: "CITIZEN", place: "Pahalgam, Amarnath Yatra", heartRate: 88, spO2: 95, temperature: 36.2, batteryLevel: 80 },
  { userId: "band-05", userName: "Tashi Dorje", bandId: "AA:05:AM:SHESH", lat: 34.0915, lon: 75.4965, sos: true, source: "Band No: 05", role: "VOLUNTEER", place: "Sheshnag, Amarnath Yatra", heartRate: 118, spO2: 89, temperature: 37.2, batteryLevel: 52 },
];
type Alert = {
  _id: string; notes: string; status: string;
  victim: { _id: string; fullName: string };
};

export default function IotMonitor() {
  const [readings, setReadings] = useState<Reading[]>(() => YATRA_BANDS.map(band => ({ ...band, ts: new Date().toISOString() })));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");
  const [center, setCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      const token = localStorage.getItem("token");
      if (!token) { setError("Sign in as an administrator to view device telemetry."); return; }
      pending = true;
      try {
        const options = { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal };
        const [locations, emergencies] = await Promise.all([
          authFetch(`${apiBase()}/location/latest`, options), authFetch(`${apiBase()}/sos/active`, options)
        ]);
        if (locations.status === 401 || emergencies.status === 401) throw new Error("Session expired. Sign in again.");
        if (!locations.ok || !emergencies.ok) throw new Error("Unable to refresh device data.");
        const data: Reading[] = await locations.json();
        const active: Alert[] = await emergencies.json();
        if (controller.signal.aborted) return;
        const now = new Date().toISOString();
        const liveIds = new Set(data.map(reading => reading.bandId));
        const yatraBands = YATRA_BANDS.filter(band => !liveIds.has(band.bandId)).map(band => ({ ...band, ts: now }));
        setReadings([...data, ...yatraBands]);
        setAlerts(active);
        if (data[0]) setCenter(previous => previous || [data[0].lat, data[0].lon]);
        setUpdated(new Date().toLocaleTimeString());
        setError("");
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Connection failed.");
      } finally { pending = false; }
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => { clearInterval(interval); controller.abort(); };
  }, []);

  const resolveAlert = async (id: string) => {
    try {
      const response = await authFetch(`${apiBase()}/sos/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ alertId: id, status: "RESOLVED", notes: "Resolved from IoT monitor" })
      });
      if (!response.ok) throw new Error("Could not resolve alert. Check your login.");
      setAlerts(current => current.filter(alert => alert._id !== id));
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed."); }
  };

  const activeVictims = new Set(alerts.map(alert => alert.victim?._id));
  const isSos = (reading: Reading) => reading.sos || activeVictims.has(reading.userId);
  const mapUsers = readings.map(reading => ({
    id: reading.userId, name: reading.userName, lat: reading.lat, lon: reading.lon,
    sos: isSos(reading), role: reading.role === "VOLUNTEER" ? "VOLUNTEER" as const : "CITIZEN" as const,
    lastUpdate: reading.ts, placeName: reading.place || `Band ${reading.bandId}`
  }));
  const showValue = (value: number | undefined, unit: string) =>
    typeof value === "number" && Number.isFinite(value) ? `${value}${unit}` : "Not reported";
  const publisherName = (source: string) => (source === "esp32" ? "Band No: 25" : source);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">IoT Monitor</h1>
        <p className="text-slate-500">Incoming band telemetry · refreshes every 3 seconds{updated && ` · checked ${updated}`}</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error} <Link href="/login" className="underline">Sign in</Link></p>}
      <p className="rounded-xl bg-blue-50 p-4 text-blue-900">
        The live assigned band stays on this map. The other rows are yatra bands along Vaishno Devi and the Amarnath route.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm text-slate-800">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {["Wearer / Band", "Publisher", "Last packet", "GPS", "Heart rate", "SpO₂", "Temperature", "Battery", "SOS"].map(label => (
                <th key={label} className="p-3 font-semibold whitespace-nowrap">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {readings.map(reading => (
              <tr key={reading.bandId} className="border-t border-slate-100">
                <td className="p-3 font-medium text-slate-900">{reading.userName}<br /><code className="text-xs text-slate-500">{reading.bandId}</code></td>
                <td className="p-3">{publisherName(reading.source)}</td>
                <td className="p-3">{new Date(reading.ts).toLocaleTimeString()}<br /><span className="text-slate-500">{Date.now() - Date.parse(reading.ts) > 15000 ? "Stale (>15s)" : "Recent (<15s)"}</span></td>
                <td className="p-3 font-mono text-xs">{reading.lat.toFixed(5)}, {reading.lon.toFixed(5)}</td>
                <td className="p-3">{showValue(reading.heartRate, " bpm")}</td>
                <td className="p-3">{showValue(reading.spO2, "%")}</td>
                <td className="p-3">{showValue(reading.temperature, " °C")}</td>
                <td className="p-3">{showValue(reading.batteryLevel, "%")}</td>
                <td className={`p-3 font-bold ${isSos(reading) ? "text-red-600" : "text-green-700"}`}>{isSos(reading) ? "ACTIVE" : "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!readings.length && <p className="p-6 text-slate-500">Waiting for telemetry from an assigned band.</p>}
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Active SOS alerts ({alerts.length})</h2>
        {alerts.map(alert => (
          <div key={alert._id} className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-slate-800">
            <div>
              <strong className="text-slate-900">{alert.victim?.fullName || "Unknown wearer"}</strong>
              <p className="text-slate-700">{alert.notes}</p>
              <p className="text-xs text-slate-500">{alert.status} · {alert._id}</p>
            </div>
            <button onClick={() => resolveAlert(alert._id)} className="rounded-lg bg-green-700 px-4 py-2 text-white">Resolve</button>
          </div>
        ))}
        {!alerts.length && <p className="text-slate-500">No active SOS alerts.</p>}
      </section>
      <div className="h-[520px] overflow-hidden rounded-xl border bg-white"><LiveMap users={mapUsers} centerOn={readings.length > 1 ? null : center} /></div>
    </div>
  );
}
