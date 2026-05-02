"use client";

import { useCallback, useEffect, useState } from "react";

export default function LoanPage() {
  const [text, setText] = useState("");
  const [income, setIncome] = useState(25000);
  const [risk, setRisk] = useState<Record<string, unknown> | null>(null);
  const [emi, setEmi] = useState(5000);
  const [fuel, setFuel] = useState(8000);
  const [maint, setMaint] = useState(2000);
  const [burden, setBurden] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState<{ id: string; createdAt: string; preview: string; risk: Record<string, unknown> }[]>([]);

  const loadHistory = useCallback(async () => {
    const r = await fetch("/api/loan/inquiries", { credentials: "include" });
    if (!r.ok) return;
    const d = await r.json();
    setHistory(d.inquiries ?? []);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function analyze() {
    setErr("");
    const r = await fetch("/api/loan/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text, monthlyIncomeEstimate: income }),
    });
    const data = await r.json();
    if (!r.ok) {
      setErr(typeof data.message === "string" ? data.message : "जाँच नहीं हुई — टेक्स्ट 3+ अक्षर।");
      return;
    }
    setRisk(data.risk);
    loadHistory();
  }

  async function calcBurden() {
    const r = await fetch("/api/loan/analyze", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emi, monthlyIncomeEstimate: income, fuelEstimate: fuel, maintenanceEstimate: maint }),
    });
    const data = await r.json();
    setBurden(data.burden);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">लोन सेफ्टी</h1>

      {history.length > 0 && (
        <div className="rounded-2xl bg-white p-4 text-sm shadow ring-1 ring-teal-900/10">
          <p className="font-semibold text-teal-900">पुरानी जाँच</p>
          <ul className="mt-2 space-y-2">
            {history.slice(0, 6).map((h) => (
              <li key={h.id} className="rounded-lg bg-teal-50/80 px-2 py-2">
                <span className="font-medium">{String(h.risk?.level ?? "?")}</span> · {h.preview}
                <span className="block text-xs text-teal-700/70">{new Date(h.createdAt).toLocaleString("hi-IN")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10">
        <label className="block text-sm font-medium">SMS / मैसेज पेस्ट करें</label>
        <textarea
          className="h-32 w-full rounded-xl border p-3 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="block text-sm font-medium">महीने की कमाई (अनुमान)</label>
        <input
          type="number"
          className="w-full rounded-xl border px-3 py-2"
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="button" onClick={analyze} className="w-full rounded-xl bg-teal-700 py-3 font-semibold text-white">
          जाँच
        </button>
      </div>
      {risk && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm ring-1 ring-amber-200">
          <p className="font-bold">Level: {String(risk.level)} (score {String(risk.riskScore)})</p>
          <ul className="mt-2 list-disc pl-5">
            {(risk.flags as string[]).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <a className="mt-2 inline-block text-teal-800 underline" href={String(risk.rbiCheckUrl)} target="_blank" rel="noreferrer">
            RBI NBFC सूची
          </a>
        </div>
      )}

      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10">
        <p className="font-semibold text-teal-900">EMI vs गाड़ी खर्च</p>
        <input type="number" className="w-full rounded-xl border px-3 py-2" value={emi} onChange={(e) => setEmi(Number(e.target.value))} placeholder="EMI" />
        <input type="number" className="w-full rounded-xl border px-3 py-2" value={fuel} onChange={(e) => setFuel(Number(e.target.value))} placeholder="Fuel/CNG" />
        <input type="number" className="w-full rounded-xl border px-3 py-2" value={maint} onChange={(e) => setMaint(Number(e.target.value))} placeholder="Service" />
        <button type="button" onClick={calcBurden} className="w-full rounded-xl border border-teal-700 py-2 font-semibold text-teal-800">
          बोझ निकालो
        </button>
        {burden && (
          <p className="text-sm text-teal-900">
            कुल फिक्स्ड ≈ ₹{String(burden.burden)} / {String(burden.burdenRatio)}% कमाई · {String(burden.verdict)}
          </p>
        )}
      </div>
    </div>
  );
}
