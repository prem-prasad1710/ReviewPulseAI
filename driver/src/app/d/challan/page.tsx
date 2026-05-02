"use client";

import { useCallback, useEffect, useState } from "react";

type CaseRow = {
  id: string;
  amount: number;
  offenceText: string | null;
  createdAt: string;
  explainJson: string;
};

export default function ChallanPage() {
  const [amount, setAmount] = useState(500);
  const [offence, setOffence] = useState("");
  const [res, setRes] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState("");
  const [cases, setCases] = useState<CaseRow[]>([]);

  const loadCases = useCallback(async () => {
    const r = await fetch("/api/challan", { credentials: "include" });
    if (!r.ok) return;
    const d = await r.json();
    setCases(d.cases ?? []);
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  async function submit() {
    setErr("");
    const r = await fetch("/api/challan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount, offenceText: offence || undefined }),
    });
    const data = await r.json();
    if (!r.ok) {
      setErr(String(data.error));
      return;
    }
    setRes(data);
    loadCases();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">चालान मदद</h1>

      {cases.length > 0 && (
        <div className="rounded-2xl bg-white p-4 text-sm shadow ring-1 ring-teal-900/10">
          <p className="font-semibold text-teal-900">पुराने</p>
          <ul className="mt-2 space-y-1">
            {cases.slice(0, 8).map((c) => (
              <li key={c.id} className="flex justify-between gap-2 border-b border-teal-900/5 py-1">
                <span>₹{c.amount}</span>
                <span className="text-teal-800/70">{new Date(c.createdAt).toLocaleDateString("hi-IN")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10">
        <label className="block text-sm font-medium">
          राशि (₹)
          <input
            type="number"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm font-medium">
          अपराध / नोट (optional)
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={offence}
            onChange={(e) => setOffence(e.target.value)}
            placeholder="PUC / signal / speed"
          />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="button"
          onClick={submit}
          className="w-full rounded-xl bg-teal-700 py-3 font-semibold text-white"
        >
          समझाओ
        </button>
      </div>
      {res && (
        <div className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-teal-900/10">
          <p className="text-lg font-bold text-teal-900">{String(res.title)}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {(res.simpleHindi as string[]).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p className="mt-3 font-semibold">डिस्प्यूट: {String(res.canDisputeHint)}</p>
          <p className="mt-2 font-semibold">स्टेप</p>
          <ul className="list-decimal space-y-1 pl-5">
            {(res.steps as string[]).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
