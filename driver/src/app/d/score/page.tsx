"use client";

import { useEffect, useState } from "react";

export default function ScorePage() {
  const [data, setData] = useState<{ score: number; breakdown: { label: string; points: number; note: string }[] } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/score", { credentials: "include" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-teal-800/80">लोड…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">Confidence Score</h1>
      <div className="rounded-2xl bg-teal-700 p-6 text-white shadow">
        <p className="text-5xl font-black">{data.score}</p>
        <p className="text-sm opacity-90">/ 100</p>
      </div>
      <ul className="space-y-2">
        {data.breakdown.map((b, i) => (
          <li key={i} className="rounded-xl bg-white p-3 text-sm shadow ring-1 ring-teal-900/10">
            <span className="font-semibold">{b.label}</span>{" "}
            <span className={b.points < 0 ? "text-red-600" : "text-teal-700"}>
              {b.points > 0 ? "+" : ""}
              {b.points}
            </span>
            <p className="text-teal-900/80">{b.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
