"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Fingerprint,
  HeartPulse,
  Loader2,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  Sun,
  Tent,
  Users,
} from "lucide-react";
import { apiUrl, authFetch } from "@/lib/api";

const IDEAS = [
  {
    letter: "A",
    title: "Alert on the clinical floor",
    body: "Heart rate under 45 or over 140, SpO2 under 90, temperature at 35 or 39, a fall over 3 g, or blood pressure at 80 or 180 opens an SOS. Event codes 13 to 16 are critical on their own.",
    icon: HeartPulse,
    accent: "from-rose-500 to-orange-400",
    chip: "bg-rose-50 text-rose-700",
  },
  {
    letter: "A",
    title: "Assign the nearest free responder",
    body: "The closest rescuer or volunteer who has a known location, and who is not already assigned or in progress, is dispatched to the wearer.",
    icon: Navigation,
    accent: "from-sky-500 to-cyan-400",
    chip: "bg-sky-50 text-sky-700",
  },
  {
    letter: "S",
    title: "Shelter check-in inside 30 m",
    body: "When a band is within 30 metres of a shelter, it is added to that shelter and a CHECK_IN row is written.",
    icon: Tent,
    accent: "from-teal-500 to-emerald-400",
    chip: "bg-teal-50 text-teal-700",
  },
  {
    letter: "R",
    title: "Record a hash-chained audit",
    body: "Every check-in, dispatch, and learning round stores the SHA-256 of the previous row plus the new event, so the log shows tampering.",
    icon: Fingerprint,
    accent: "from-violet-500 to-indigo-400",
    chip: "bg-violet-50 text-violet-700",
  },
  {
    letter: "A",
    title: "Adapt by federated rounds",
    body: "Each shelter summary is averaged by sample count into one shared model. Learned limits cannot become looser than the clinical floor.",
    icon: Activity,
    accent: "from-amber-500 to-yellow-400",
    chip: "bg-amber-50 text-amber-800",
  },
];

type Shelter = {
  _id?: string;
  name: string;
  lat?: number;
  lon?: number;
  powerSource?: string;
  bands?: string[];
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

type Person = { fullName?: string };

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
  victim?: Person;
  rescuer?: Person;
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

function showTime(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : "—";
}

function eventTone(type?: string) {
  if (type === "CHECK_IN") return "bg-teal-50 text-teal-800 ring-teal-200";
  if (type === "DISPATCH") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (type === "FEDERATED_ROUND") return "bg-violet-50 text-violet-800 ring-violet-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function statusTone(status?: string) {
  if (status === "IN_PROGRESS") return "bg-amber-100 text-amber-900";
  if (status === "ASSIGNED") return "bg-sky-100 text-sky-900";
  return "bg-rose-100 text-rose-800";
}

export default function NetworkPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [banner, setBanner] = useState("");
  const [bannerKind, setBannerKind] = useState<"signed-out" | "error" | "">("");
  const [running, setRunning] = useState(false);
  const [checkedAt, setCheckedAt] = useState("");
  const [copied, setCopied] = useState("");

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
      setOverview({
        shelters: data.shelters || [],
        audit: data.audit || [],
        model: data.model || {},
        alerts: data.alerts || [],
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
    const interval = setInterval(() => { refresh(); }, 5000);
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

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(hash);
      window.setTimeout(() => setCopied((current) => (current === hash ? "" : current)), 1600);
    } catch {
      setCopied("");
    }
  };

  const model = overview?.model;
  const alerts = overview?.alerts || [];
  const shelters = overview?.shelters || [];
  const checkedIn = shelters.reduce((sum, shelter) => sum + (shelter.bands?.length || 0), 0);
  const roundShelter = shelters[0]?.name || "Rajpath Relief Tent";
  const metrics = [
    { label: "Heart rate", value: `${model?.hrLow ?? "—"}–${model?.hrHigh ?? "—"}`, hint: "floor 45–140" },
    { label: "SpO2 floor", value: model?.spo2Low ?? "—", hint: "never under 90" },
    { label: "Temperature", value: `${model?.tempLow ?? "—"}–${model?.tempHigh ?? "—"}`, hint: "floor 35–39" },
    { label: "Fall ceiling", value: model?.fallHigh ?? "—", hint: "3 g" },
    { label: "Blood pressure", value: `${model?.bpLow ?? "—"}–${model?.bpHigh ?? "—"}`, hint: "floor 80–180" },
  ];

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
        <div role="alert" className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 ${bannerKind === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
          <p className="text-sm font-medium">{banner}</p>
          {bannerKind === "signed-out" ? (
            <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Sign in</Link>
          ) : (
            <button type="button" onClick={() => refresh()} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">Try again</button>
          )}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold">Five AASRA ideas</h2>
          <p className="text-xs text-slate-500">Alert · Assign · Shelter · Record · Adapt</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {IDEAS.map((idea) => (
            <article key={idea.title} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${idea.accent} text-white shadow-sm`}>
                  <idea.icon className="h-5 w-5" />
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-black ${idea.chip}`}>{idea.letter}</span>
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{idea.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{idea.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Shelters</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shelters.map((shelter) => (
            <article key={shelter._id || shelter.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug">{shelter.name}</h3>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">
                    <Sun className="h-3 w-3" />
                    {shelter.powerSource || "Power"}
                  </span>
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {typeof shelter.lat === "number" ? shelter.lat.toFixed(3) : "—"}, {typeof shelter.lon === "number" ? shelter.lon.toFixed(3) : "—"}
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users className="h-4 w-4 text-teal-600" />
                  {shelter.bands?.length || 0} bands checked in
                </p>
              </div>
            </article>
          ))}
        </div>
        {overview && !shelters.length && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No shelters have been registered.</p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <h2 className="text-lg font-bold">Active dispatch</h2>
          {alerts.map((alert) => (
            <article key={alert._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{alert.victim?.fullName || "Unknown wearer"}</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone(alert.status)}`}>{alert.status || "OPEN"}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {alert.rescuer?.fullName ? `Assigned to ${alert.rescuer.fullName}` : "Waiting for a free responder"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{alert.reason || alert.notes || "No reason recorded"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                <span className="rounded-full bg-slate-100 px-2 py-1">{alert.trigger || "SOS"}</span>
                {typeof alert.eventCode === "number" && <span className="rounded-full bg-slate-100 px-2 py-1">Code {alert.eventCode}</span>}
                {alert.shelterName && <span className="rounded-full bg-slate-100 px-2 py-1">{alert.shelterName}</span>}
                {typeof alert.distanceMeters === "number" && <span className="rounded-full bg-slate-100 px-2 py-1">{alert.distanceMeters} m</span>}
                {alert.checkedIn && <span className="rounded-full bg-teal-50 px-2 py-1 text-teal-800">Checked in</span>}
              </div>
            </article>
          ))}
          {overview && !alerts.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-2 font-semibold">No active dispatch</p>
              <p className="mt-1 text-sm text-slate-500">A help button, a critical vital, or a critical AI score will assign the nearest free responder.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold">Shared model</h2>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-800">{model?.samples || 0} samples</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Learned limits stay at least as strict as the clinical floor.</p>
          <dl className="mt-4 space-y-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <div>
                  <dt className="text-xs text-slate-500">{metric.label}</dt>
                  <dd className="text-sm font-bold text-slate-900">{metric.value}</dd>
                </div>
                <span className="text-[11px] font-medium text-slate-400">{metric.hint}</span>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Tamper-evident log</h2>
        <ol className="space-y-2">
          {(overview?.audit || []).map((row, index) => (
            <li key={row._id || row.hash || index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${eventTone(row.type)}`}>{row.type || "EVENT"}</span>
                <time className="text-xs text-slate-500">{showTime(row.createdAt)}</time>
              </div>
              <p className="mt-2 text-sm font-semibold">{row.shelterName || row.rescuerName || "Network event"}</p>
              <p className="mt-1 text-xs text-slate-500">
                {row.bandId ? <code>{row.bandId}</code> : "No band"}
                {typeof row.distanceMeters === "number" ? ` · ${row.distanceMeters} m` : ""}
              </p>
              <button
                type="button"
                onClick={() => row.hash && copyHash(row.hash)}
                className="mt-3 block max-w-full truncate rounded-xl bg-slate-950 px-3 py-2 text-left font-mono text-[11px] text-cyan-200"
                title={row.prevHash ? `previous ${row.prevHash}` : row.hash}
              >
                {copied && copied === row.hash ? "Copied" : (row.hash || "—")}
              </button>
            </li>
          ))}
        </ol>
        {overview && !overview.audit.length && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No audit rows yet. Run a shelter round to append one.</p>
        )}
      </section>
    </div>
  );
}
