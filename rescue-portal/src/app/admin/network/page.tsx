"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Loader2,
  MapPin,
  Radio,
  Sun,
  Tent,
  Users,
} from "lucide-react";
import { apiUrl, authFetch } from "@/lib/api";

type Shelter = {
  _id?: string;
  name: string;
  lat?: number;
  lon?: number;
  powerSource?: string;
  bands?: string[];
  status?: string;
};

type AuditRow = {
  _id?: string;
  type?: string;
  hash?: string;
  prevHash?: string;
  shelterName?: string;
  bandId?: string;
  rescuerName?: string;
  distanceMeters?: number;
  createdAt?: string;
};

type Person = { fullName?: string; phoneNumber?: string };

type AlertRow = {
  _id: string;
  status?: string;
  trigger?: string;
  reason?: string;
  notes?: string;
  shelterName?: string;
  distanceMeters?: number;
  checkedIn?: boolean;
  eventCode?: number;
  priority?: string;
  location?: {
    type?: string;
    coordinates?: [number, number]; // [lon, lat]
  };
  victim?: Person;
  rescuer?: Person;
  createdAt?: string;
  updatedAt?: string;
};

type SharedModel = {
  samples?: number;
  hrLow?: number;
  hrHigh?: number;
  spo2Low?: number;
  tempLow?: number;
  tempHigh?: number;
  fallHigh?: number;
  bpLow?: number;
  bpHigh?: number;
};

type Overview = {
  shelters: Shelter[];
  audit: AuditRow[];
  model: SharedModel;
  alerts: AlertRow[];
};

function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NetworkPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [banner, setBanner] = useState("");
  const [bannerKind, setBannerKind] = useState<"signed-out" | "error" | "">("");
  const [running, setRunning] = useState(false);
  const [checkedAt, setCheckedAt] = useState("");
  const [recentNotice, setRecentNotice] = useState<{
    bandId: string;
    shelterName: string;
    wearerName?: string;
    time: string;
  } | null>(null);

  const prevBandsRef = useRef<Record<string, string[]>>({});

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      setBannerKind("signed-out");
      setBanner("Sign in as an administrator to view the assistance network.");
      return;
    }
    try {
      const response = await authFetch(apiUrl("/network/overview"), { signal });
      if (signal?.aborted) return;
      if (response.status === 401) {
        setBannerKind("signed-out");
        setBanner("Session expired. Sign in again.");
        return;
      }
      if (!response.ok) throw new Error("The network overview could not be loaded.");
      const data = (await response.json()) as Overview;
      if (signal?.aborted) return;

      const shelters = data.shelters || [];
      const alerts = data.alerts || [];
      const audit = data.audit || [];

      // Check for real-time check-in notice
      let detectedNotice: { bandId: string; shelterName: string; wearerName?: string; time: string } | null = null;
      for (const shelter of shelters) {
        const prev = prevBandsRef.current[shelter.name] || [];
        const current = shelter.bands || [];
        const added = current.filter((b) => !prev.includes(b));
        if (added.length > 0) {
          const matchingAlert = alerts.find((a) => (a.notes || "").includes(added[0]) || a.shelterName === shelter.name);
          detectedNotice = {
            bandId: added[0],
            shelterName: shelter.name,
            wearerName: matchingAlert?.victim?.fullName,
            time: new Date().toLocaleTimeString(),
          };
          break;
        }
      }

      // Update ref
      const currentMap: Record<string, string[]> = {};
      for (const shelter of shelters) {
        currentMap[shelter.name] = shelter.bands || [];
      }
      prevBandsRef.current = currentMap;

      // If no polling diff yet, display latest CHECK_IN from audit
      if (!detectedNotice) {
        const latestCheckIn = audit.find((a) => a.type === "CHECK_IN" && a.bandId);
        if (latestCheckIn && latestCheckIn.bandId && latestCheckIn.shelterName) {
          const matchingAlert = alerts.find(
            (a) => (a.notes || "").includes(latestCheckIn.bandId!) || a.shelterName === latestCheckIn.shelterName
          );
          const checkInDate = latestCheckIn.createdAt ? new Date(latestCheckIn.createdAt) : new Date();
          detectedNotice = {
            bandId: latestCheckIn.bandId,
            shelterName: latestCheckIn.shelterName,
            wearerName: matchingAlert?.victim?.fullName,
            time: checkInDate.toLocaleTimeString(),
          };
        }
      }

      if (detectedNotice) {
        setRecentNotice(detectedNotice);
      }

      setOverview({
        shelters,
        audit,
        model: data.model || {},
        alerts,
      });
      setCheckedAt(new Date().toLocaleTimeString());
      setBanner("");
      setBannerKind("");
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
      setBannerKind("error");
      setBanner(error instanceof Error ? error.message : "The network overview could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    const interval = setInterval(() => {
      refresh();
    }, 5000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [refresh]);

  const runRound = async () => {
    const shelterName = overview?.shelters?.[0]?.name || "Rajpath Relief Tent";
    setRunning(true);
    try {
      const response = await authFetch(apiUrl("/network/learn"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelterName,
          samples: 4,
          hrHigh: 136,
          hrLow: 48,
          spo2Low: 93,
          tempHigh: 38.4,
          tempLow: 35.4,
          fallHigh: 2.8,
          bpHigh: 170,
          bpLow: 90,
        }),
      });
      if (response.status === 401) {
        setBannerKind("signed-out");
        setBanner("Session expired. Sign in again.");
        return;
      }
      if (!response.ok) throw new Error("The shelter round could not be saved.");
      await refresh();
    } catch (error) {
      setBannerKind("error");
      setBanner(error instanceof Error ? error.message : "The shelter round could not be saved.");
    } finally {
      setRunning(false);
    }
  };

  const alerts = overview?.alerts || [];
  const shelters = overview?.shelters || [];
  const checkedIn = shelters.reduce((sum, shelter) => sum + (shelter.bands?.length || 0), 0);
  const roundShelter = shelters[0]?.name || "Rajpath Relief Tent";

  // Helper to determine if a shelter has a nearby active SOS alert
  const getNearbyAlerts = (shelter: Shelter) => {
    return alerts.filter((alert) => {
      if (alert.shelterName && alert.shelterName.trim().toLowerCase() === shelter.name.trim().toLowerCase()) {
        return true;
      }
      if (
        typeof shelter.lat === "number" &&
        typeof shelter.lon === "number" &&
        alert.location?.coordinates &&
        Array.isArray(alert.location.coordinates)
      ) {
        const [alertLon, alertLat] = alert.location.coordinates;
        const dist = distanceInMeters(shelter.lat, shelter.lon, alertLat, alertLon);
        return dist <= 2000;
      }
      return false;
    });
  };

  // Helper to resolve wearer name for a band
  const resolveWearerName = (bandId: string) => {
    const alert = alerts.find((a) => (a.notes || "").includes(bandId));
    if (alert?.victim?.fullName) return alert.victim.fullName;
    if (bandId === "00:1B:44:11:3A:B7") return "Rohan Gupta";
    return undefined;
  };

  return (
    <div className="space-y-6 text-slate-800">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-900/10 md:px-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
            <span>{checkedAt ? `Checked ${checkedAt}` : "Waiting for the network"}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Aasra Network</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            Shelters, the nearest free responder, and one shared clinical model. The view refreshes every 5 seconds.
          </p>
        </div>
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <dl className="grid min-w-0 flex-1 grid-cols-3 gap-3">
            {[
              { label: "Shelters", value: shelters.length },
              { label: "Checked in", value: checkedIn },
              { label: "Active dispatch", value: alerts.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur sm:px-4">
                <dt className="text-[11px] uppercase tracking-wider text-slate-300">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-black">{overview ? stat.value : "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="shrink-0">
            <button
              type="button"
              onClick={runRound}
              disabled={running || bannerKind === "signed-out"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
              {running ? "Running round…" : "Run a shelter round"}
            </button>
            <p className="mt-2 text-xs text-slate-400">Next round uses {roundShelter}</p>
          </div>
        </div>
      </header>

      {banner && (
        <div
          role="alert"
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 ${
            bannerKind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <p className="text-sm font-medium">{banner}</p>
          {bannerKind === "signed-out" ? (
            <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Sign in
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => refresh()}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-800 ring-1 ring-rose-200"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Real-time check-in notice */}
      {recentNotice && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-4 text-teal-950 shadow-sm">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
              <BellRing className="h-5 w-5 animate-bounce" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-teal-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-900">
                  Real-time Check-In Notice
                </span>
                <span className="text-xs font-semibold text-teal-700">{recentNotice.time}</span>
              </div>
              <p className="mt-1 text-sm font-medium leading-relaxed text-teal-950">
                Band{" "}
                <code className="rounded bg-teal-100 px-1.5 py-0.5 font-mono text-xs font-bold text-teal-900">
                  {recentNotice.bandId}
                </code>
                {recentNotice.wearerName ? ` (${recentNotice.wearerName})` : ""} checked in at{" "}
                <span className="font-bold underline decoration-teal-400">{recentNotice.shelterName}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shelters / Stations Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Shelters & Stations</h2>
            <p className="text-xs text-slate-500">Registered network shelters, active check-ins, and emergency status</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {shelters.length} registered
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shelters.map((shelter) => {
            const nearbyAlerts = getNearbyAlerts(shelter);
            const isNearSOS = nearbyAlerts.length > 0;
            const bands = shelter.bands || [];

            return (
              <article
                key={shelter._id || shelter.name}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 ${
                  isNearSOS
                    ? "border-2 border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20 shadow-md shadow-rose-100"
                    : "border border-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                {/* Top accent bar */}
                <div
                  className={`h-2 ${
                    isNearSOS
                      ? "bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 animate-pulse"
                      : "bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500"
                  }`}
                />

                <div className="p-5">
                  {/* Header: Name + Status/Power */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{shelter.name}</h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {typeof shelter.lat === "number" ? shelter.lat.toFixed(3) : "—"}, {typeof shelter.lon === "number" ? shelter.lon.toFixed(3) : "—"}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                      <Sun className="h-3 w-3" />
                      {shelter.powerSource || "SOLAR"}
                    </span>
                  </div>

                  {/* Highlight for Active SOS Alert */}
                  {isNearSOS && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-950">
                      <div className="flex items-center justify-between font-bold text-rose-900">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 animate-pulse" />
                          <span>Active SOS Near Station</span>
                        </span>
                        <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-900">
                          {nearbyAlerts[0]?.status || "ACTIVE"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-rose-900 leading-relaxed font-medium">
                        Wearer: <span className="font-bold">{nearbyAlerts[0]?.victim?.fullName || "Emergency Wearer"}</span>
                        {nearbyAlerts[0]?.reason ? ` · ${nearbyAlerts[0].reason}` : ""}
                      </p>
                      {nearbyAlerts[0]?.rescuer?.fullName && (
                        <p className="mt-1 text-[11px] text-rose-800">
                          Assigned Responder: <span className="font-semibold">{nearbyAlerts[0].rescuer.fullName}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bands Count */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-600" />
                      Checked-in bands
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-bold ${
                        bands.length > 0 ? "bg-teal-100 text-teal-800" : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      {bands.length}
                    </span>
                  </div>

                  {/* List of checked-in bands */}
                  <div className="mt-3">
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Checked-in wearers / bands:
                    </div>
                    {bands.length > 0 ? (
                      <ul className="space-y-1.5">
                        {bands.map((bandId) => {
                          const wearer = resolveWearerName(bandId);
                          return (
                            <li
                              key={bandId}
                              className="flex items-center justify-between rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-1.5 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                                <span className="truncate font-semibold text-slate-800">
                                  {wearer ? wearer : bandId}
                                </span>
                                {wearer && (
                                  <span className="font-mono text-[10px] text-slate-500">
                                    ({bandId})
                                  </span>
                                )}
                              </div>
                              <span className="shrink-0 rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                                Inside 30m
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-center text-xs text-slate-400">
                        No bands currently checked in
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {overview && !shelters.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            <Tent className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 font-semibold">No shelters registered</p>
            <p className="mt-1 text-xs text-slate-400">Shelters added to the database will automatically appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
