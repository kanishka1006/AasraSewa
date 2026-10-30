"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const LiveMap = dynamic(() => import("@/components/Map/LiveMap"), { ssr: false });
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Reading = {
  userId: string; userName: string; bandId: string;
  lat: number; lon: number; ts: string; sos: boolean; source: string;
  heartRate?: number; spO2?: number; temperature?: number; batteryLevel?: number;
};
type Alert = {
  _id: string; notes: string; status: string;
  victim: { _id: string; fullName: string };
};

export default function IotMonitor() {
  const [readings, setReadings] = useState<Reading[]>([]);
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
          fetch(`${API}/location/latest`, options), fetch(`${API}/sos/active`, options)
        ]);
        if (locations.status === 401 || emergencies.status === 401) throw new Error("Session expired. Sign in again.");
        if (!locations.ok || !emergencies.ok) throw new Error("Unable to refresh device data.");
        const data: Reading[] = await locations.json();
        const active: Alert[] = await emergencies.json();
        if (controller.signal.aborted) return;
        setReadings(data);
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
      const response = await fetch(`${API}/sos/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ alertId: id, status: "RESOLVED", notes: "Resolved from IoT monitor" })
      });
      if (!response.ok) throw new Error("Could not resolve alert. Check your login.");
      setAlerts(current => current.filter(alert => alert._id !== id));
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed."); }
  };

  const activeVictims = new Set(alerts.map(alert => alert.victim?._id));
  const mapUsers = readings.map(reading => ({
    id: reading.userId, name: reading.userName, lat: reading.lat, lon: reading.lon,
    sos: activeVictims.has(reading.userId), role: "CITIZEN" as const,
    lastUpdate: reading.ts, placeName: `Band ${reading.bandId}`
  }));
  const showValue = (value: number | undefined, unit: string) =>
    typeof value === "number" && Number.isFinite(value) ? `${value}${unit}` : "Not reported";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">IoT Monitor</h1>
        <p className="text-slate-500">Incoming band telemetry · refreshes every 3 seconds{updated && ` · checked ${updated}`}</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error} <Link href="/login" className="underline">Sign in</Link></p>}
      <p className="rounded-xl bg-blue-50 p-4 text-blue-900">
        Only devices assigned to an active wearer appear here. Rows marked “simulator” contain generated test readings.
      </p>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100"><tr>{["Wearer / Band", "Publisher", "Last packet", "GPS", "Heart rate", "SpO₂", "Temperature", "Battery", "SOS"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
          <tbody>{readings.map(reading => <tr key={reading.bandId} className="border-t">
            <td className="p-3 font-medium">{reading.userName}<br /><code className="text-xs">{reading.bandId}</code></td>
            <td className="p-3">{reading.source}</td>
            <td className="p-3">{new Date(reading.ts).toLocaleTimeString()}<br />{Date.now() - Date.parse(reading.ts) > 15000 ? "Stale (>15s)" : "Recent (<15s)"}</td>
            <td className="p-3 font-mono">{reading.lat.toFixed(5)}, {reading.lon.toFixed(5)}</td>
            <td className="p-3">{showValue(reading.heartRate, " bpm")}</td>
            <td className="p-3">{showValue(reading.spO2, "%")}</td>
            <td className="p-3">{showValue(reading.temperature, " °C")}</td>
            <td className="p-3">{showValue(reading.batteryLevel, "%")}</td>
            <td className={`p-3 font-bold ${activeVictims.has(reading.userId) ? "text-red-600" : "text-green-700"}`}>{activeVictims.has(reading.userId) ? "ACTIVE" : "None"}</td>
          </tr>)}</tbody>
        </table>
        {!readings.length && <p className="p-6 text-slate-500">Waiting for telemetry from an assigned band.</p>}
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Active SOS alerts ({alerts.length})</h2>
        {alerts.map(alert => <div key={alert._id} className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div><strong>{alert.victim?.fullName || "Unknown wearer"}</strong><p>{alert.notes}</p><p className="text-xs">{alert.status} · {alert._id}</p></div>
          <button onClick={() => resolveAlert(alert._id)} className="rounded-lg bg-green-700 px-4 py-2 text-white">Resolve</button>
        </div>)}
        {!alerts.length && <p className="text-slate-500">No active SOS alerts.</p>}
      </section>
      <div className="h-[520px] overflow-hidden rounded-xl border bg-white"><LiveMap users={mapUsers} centerOn={center} /></div>
    </div>
  );
}
