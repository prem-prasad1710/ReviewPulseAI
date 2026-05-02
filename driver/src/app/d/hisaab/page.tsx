"use client";

import { useCallback, useEffect, useState } from "react";
import type { EarningsTruthResult } from "@/lib/engines/earnings";
import { buildEarningsShareText } from "@/lib/share-earnings";

const platforms = ["UBER", "OLA", "RAPIDO", "OTHER"] as const;

type CheckRow = {
  id: string;
  platform: string;
  createdAt: string;
  resultJson: string;
};

function parseResult(json: string): EarningsTruthResult | null {
  try {
    const o = JSON.parse(json) as EarningsTruthResult;
    if (typeof o.expectedNet === "number" && typeof o.variance === "number") return o;
    return null;
  } catch {
    return null;
  }
}

export default function HisaabPage() {
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("UBER");
  const [tripCount, setTripCount] = useState(12);
  const [avgFare, setAvgFare] = useState(180);
  const [surge, setSurge] = useState(1);
  const [incentive, setIncentive] = useState(0);
  const [actual, setActual] = useState(1500);
  const [feePct, setFeePct] = useState<number | "">("");
  const [tolls, setTolls] = useState(0);
  const [otherDed, setOtherDed] = useState(0);
  const [result, setResult] = useState<EarningsTruthResult | null>(null);
  const [proof, setProof] = useState("");
  const [history, setHistory] = useState<CheckRow[]>([]);
  const [err, setErr] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/earnings/check", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setHistory(data.checks ?? []);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function run() {
    setErr("");
    setResult(null);
    setProof("");
    setCopyMsg("");
    const body: Record<string, unknown> = {
      platform,
      tripCount,
      avgFarePerTrip: avgFare,
      surgeMultiplier: surge,
      incentiveFlat: incentive,
      actualPayout: actual,
      tollsAndParking: tolls,
      otherDeductions: otherDed,
    };
    if (feePct !== "" && feePct !== null) body.platformFeePercent = Number(feePct) / 100;
    const res = await fetch("/api/earnings/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(typeof data.message === "string" ? data.message : data.error ?? "Error");
      return;
    }
    setResult(data.result as EarningsTruthResult);
    setProof(data.proof ?? "");
    loadHistory();
  }

  async function copyProof() {
    if (!proof) return;
    await navigator.clipboard.writeText(proof);
    setCopyMsg("कॉपी हो गया!");
    setTimeout(() => setCopyMsg(""), 2000);
  }

  async function copyShare() {
    if (!result) return;
    const t = buildEarningsShareText({ platform, result });
    await navigator.clipboard.writeText(t);
    setCopyMsg("शेयर टेक्स्ट कॉपी!");
    setTimeout(() => setCopyMsg(""), 2000);
  }

  const varianceColor =
    result && result.variance < -20 ? "text-red-700" : result && result.variance > 20 ? "text-amber-700" : "text-teal-800";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">आज का हिसाब</h1>
      <p className="text-sm text-teal-900/75">ट्रिप, सर्ज, कटौती — फिर बैंक में जो आया वो भरें।</p>

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10">
        <label className="block text-sm font-medium">
          ऐप
          <select
            className="mt-1 w-full rounded-xl border px-3 py-3"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as (typeof platforms)[number])}
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <Field label="ट्रिप संख्या" value={tripCount} onChange={setTripCount} />
        <Field label="औसत फ़ेयर / ट्रिप (₹)" value={avgFare} onChange={setAvgFare} />
        <Field label="सर्ज मल्टीप्लायर" value={surge} onChange={setSurge} step="0.1" />
        <Field label="इंसेंटिव (₹)" value={incentive} onChange={setIncentive} />
        <Field label="टोल / पार्किंग (₹)" value={tolls} onChange={setTolls} />
        <Field label="और कटौती (₹)" value={otherDed} onChange={setOtherDed} />
        <Field label="बैंक में आया (₹)" value={actual} onChange={setActual} />
        <label className="block text-sm font-medium">
          कमीशन % (optional)
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={feePct}
            onChange={(e) => setFeePct(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="25"
            inputMode="decimal"
          />
        </label>
        {err && <p className="text-sm text-red-600">{String(err)}</p>}
        {copyMsg && <p className="text-sm font-medium text-teal-700">{copyMsg}</p>}
        <button type="button" onClick={run} className="w-full rounded-xl bg-teal-700 py-3 font-semibold text-white">
          हिसाब लगाओ
        </button>
      </div>

      {result && (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10">
          <p className="font-bold text-teal-900">नतीजा</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="कुल ट्रिप से" value={`₹${result.grossFromTrips}`} />
            <Stat label="इंसेंटिव के बाद" value={`₹${result.afterIncentives}`} />
            <Stat label={`प्लेटफ़ॉर्म फी (${(result.platformFeePctUsed * 100).toFixed(0)}%)`} value={`-₹${result.platformFeeAmount}`} />
            <Stat label="अपेक्षित नेट" value={`₹${result.expectedNet}`} highlight />
            <Stat label="मिला" value={`₹${result.actualPayout}`} />
            <Stat label="फ़र्क" value={`₹${result.variance}`} valueClass={varianceColor} />
          </div>
          <p className={`text-lg font-black ${varianceColor}`}>{result.variancePercent}% vs अपेक्षा</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-teal-900/90">
            {result.likelyReasons.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p className="text-xs text-teal-800/70">{result.disclaimer}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copyShare} className="rounded-xl border border-teal-600 px-3 py-2 text-sm font-semibold text-teal-800">
              व्हाट्सऐप शेयर टेक्स्ट
            </button>
            <button type="button" onClick={copyProof} className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">
              Challenger कॉपी
            </button>
          </div>
          {proof && (
            <textarea readOnly className="h-40 w-full rounded-xl border p-3 text-xs" value={proof} />
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10">
        <p className="font-bold text-teal-900">पुराने चेक</p>
        <ul className="mt-2 space-y-2 text-sm">
          {history.map((h) => {
            const r = parseResult(h.resultJson);
            return (
              <li key={h.id} className="flex justify-between gap-2 rounded-lg bg-teal-50/80 px-3 py-2">
                <span>
                  {h.platform} · {new Date(h.createdAt).toLocaleDateString("hi-IN")}
                </span>
                {r ? (
                  <span className={r.variance < 0 ? "font-semibold text-red-700" : "text-teal-900"}>फ़र्क ₹{r.variance}</span>
                ) : (
                  <span>—</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  valueClass,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-900"}`}>
      <p className={`text-[10px] uppercase ${highlight ? "opacity-90" : "opacity-70"}`}>{label}</p>
      <p className={`font-bold ${highlight ? "" : valueClass ?? ""}`}>{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-1 w-full rounded-xl border px-3 py-2"
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
