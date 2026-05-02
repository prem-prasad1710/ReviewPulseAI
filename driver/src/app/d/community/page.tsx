"use client";

import { useCallback, useEffect, useState } from "react";

type Signal = {
  id: string;
  patternKey: string;
  city: string | null;
  weight: number;
  verified: boolean;
  note: string | null;
  createdAt: string;
};

export default function CommunityPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [city, setCity] = useState("");

  const fetchSignals = useCallback(async (filterCity: string) => {
    const q = filterCity.trim() ? `?city=${encodeURIComponent(filterCity.trim())}` : "";
    const r = await fetch(`/api/community/signals${q}`);
    const d = await r.json();
    setSignals(d.signals ?? []);
  }, []);

  useEffect(() => {
    fetchSignals("");
  }, [fetchSignals]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">चेतावनी बोर्ड</h1>
      <p className="text-sm text-teal-900/75">लोगों ने जो संदेश चेक किए — सार्वजनिक सारांश (निजी डेटा नहीं)।</p>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="शहर फ़िल्टर (optional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="button" onClick={() => fetchSignals(city)} className="rounded-xl bg-teal-700 px-4 py-2 font-semibold text-white">
          लोड
        </button>
      </div>
      <ul className="space-y-2">
        {signals.map((s) => (
          <li key={s.id} className="rounded-xl bg-white p-3 text-sm shadow ring-1 ring-teal-900/10">
            <span className="font-semibold text-teal-900">{s.patternKey}</span>
            {s.city ? <span className="text-teal-800/80"> · {s.city}</span> : null}
            <span className="ml-2 text-xs text-teal-700">×{s.weight}</span>
            {s.note ? <p className="mt-1 text-teal-900/85">{s.note}</p> : null}
            <p className="mt-1 text-xs text-teal-700/70">{new Date(s.createdAt).toLocaleString("hi-IN")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
