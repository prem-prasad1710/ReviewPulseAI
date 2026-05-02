"use client";

import { useState } from "react";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<unknown>(null);

  async function load() {
    const r = await fetch("/api/admin/overview", { headers: { "x-admin-token": token } });
    setData(await r.json());
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-teal-900">DriverSaathi Admin</h1>
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="Admin token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button type="button" className="rounded bg-teal-700 px-4 py-2 text-white" onClick={load}>
        Load stats
      </button>
      <pre className="overflow-auto rounded bg-zinc-100 p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
