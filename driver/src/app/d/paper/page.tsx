"use client";

import { useEffect, useState } from "react";

const types = ["INSURANCE", "PUC", "RC", "DL", "CUSTOM"] as const;

export default function PaperPage() {
  const [list, setList] = useState<{ id: string; title: string; dueAt: string; type: string }[]>([]);
  const [type, setType] = useState<(typeof types)[number]>("PUC");
  const [title, setTitle] = useState("PUC renewal");
  const [due, setDue] = useState("");

  async function load() {
    const r = await fetch("/api/reminders", { credentials: "include" });
    const d = await r.json();
    setList(d.reminders ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ type, title, dueAt: due }),
    });
    setDue("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">कागज़ / रिमाइंडर</h1>
      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10">
        <select className="w-full rounded-xl border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as (typeof types)[number])}>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input className="w-full rounded-xl border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button type="button" onClick={add} className="w-full rounded-xl bg-teal-700 py-3 font-semibold text-white">
          सेव
        </button>
      </div>
      <ul className="space-y-2">
        {list.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm shadow ring-1 ring-teal-900/10">
            <div>
              <span className="font-semibold">{r.title}</span> · {r.type}
              <br />
              <span className="text-teal-800/80">{new Date(r.dueAt).toLocaleDateString("hi-IN")}</span>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
              onClick={() => remove(r.id)}
            >
              हटाओ
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
