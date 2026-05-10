"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const CATS = [
  { id: "fuel", label: "पेट्रोल / CNG" },
  { id: "maintenance", label: "सर्विस / टायर" },
  { id: "toll", label: "टोल" },
  { id: "emi", label: "EMI" },
  { id: "food", label: "खाना" },
  { id: "other", label: "अन्य" },
] as const;

type Expense = { id: string; category: string; amount: number; note: string | null; spentAt: string };

export default function WalletPage() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [category, setCategory] = useState<string>("fuel");
  const [amount, setAmount] = useState(200);
  const [note, setNote] = useState("");
  const [incomeWeek, setIncomeWeek] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch("/api/wallet/expense", { credentials: "include" });
    const d = await r.json();
    setRows(d.expenses ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const by: Record<string, number> = {};
    let sum = 0;
    for (const e of rows) {
      sum += e.amount;
      by[e.category] = (by[e.category] ?? 0) + e.amount;
    }
    return { sum, by };
  }, [rows]);

  async function add() {
    await fetch("/api/wallet/expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ category, amount, note: note || undefined }),
    });
    setNote("");
    load();
  }

  const netWeek = incomeWeek > 0 ? incomeWeek - totals.sum : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">खर्च बुक</h1>
      <p className="text-sm text-teal-900/75">फ्यूल, टोल, EMI — सब एक जगह।</p>

      <div className="rounded-2xl bg-teal-800 p-4 text-white shadow">
        <p className="text-xs opacity-90">कुल खर्च (सेव्ड)</p>
        <p className="text-3xl font-black">₹{totals.sum.toFixed(0)}</p>
        {netWeek !== null && (
          <p className="mt-2 text-sm">
            सप्ताह की कमाई ₹{incomeWeek} मानकर नेट ≈ ₹{netWeek.toFixed(0)}
          </p>
        )}
      </div>

      <label className="block rounded-2xl bg-white p-4 text-sm shadow ring-1 ring-teal-900/10">
        <span className="font-medium text-teal-900">इस हफ्ते कमाई (optional)</span>
        <input
          type="number"
          className="mt-1 w-full rounded-xl border px-3 py-2"
          value={incomeWeek || ""}
          onChange={(e) => setIncomeWeek(Number(e.target.value) || 0)}
          placeholder="जैसे 12000"
        />
      </label>

      <div className="space-y-2 rounded-2xl bg-white p-4 shadow ring-1 ring-teal-900/10">
        <p className="font-semibold text-teal-900">नया खर्च</p>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="w-full rounded-xl border px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="नोट (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="button" onClick={add} className="w-full rounded-xl bg-teal-700 py-3 font-semibold text-white">
          जोड़ें
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 text-sm shadow ring-1 ring-teal-900/10">
        <p className="font-semibold text-teal-900">श्रेणी से</p>
        <ul className="mt-2 space-y-1">
          {Object.entries(totals.by).map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span>{CATS.find((c) => c.id === k)?.label ?? k}</span>
              <span className="font-medium">₹{v.toFixed(0)}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="space-y-2">
        {rows.map((e) => (
          <li key={e.id} className="rounded-xl bg-white p-3 text-sm shadow ring-1 ring-teal-900/10">
            <span className="font-semibold">{CATS.find((c) => c.id === e.category)?.label ?? e.category}</span> · ₹
            {e.amount}
            {e.note ? <span className="block text-teal-800/70">{e.note}</span> : null}
            <span className="block text-xs text-teal-700/70">{new Date(e.spentAt).toLocaleString("hi-IN")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
