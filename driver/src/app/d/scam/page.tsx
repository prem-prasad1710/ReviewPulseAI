"use client";

import { useState } from "react";

export default function ScamPage() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<Record<string, unknown> | null>(null);

  async function check() {
    const r = await fetch("/api/scam/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text }),
    });
    setRes(await r.json());
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">ये मैसेज फेक है?</h1>
      <textarea className="h-40 w-full rounded-2xl border p-3" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" onClick={check} className="w-full rounded-xl bg-teal-700 py-3 font-semibold text-white">
        चेक करो
      </button>
      {res && (
        <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-teal-900/10">
          <p className="font-bold">{String(res.verdict)}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {(res.reasons as string[]).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm">{String(res.shareLine)}</p>
        </div>
      )}
    </div>
  );
}
