"use client";

import { useEffect, useState } from "react";

export default function VaultPage() {
  const [assets, setAssets] = useState<{ id: string; fileName: string; kind: string; createdAt: string }[]>([]);

  async function load() {
    const me = await fetch("/api/me", { credentials: "include" }).then((r) => r.json());
    if (!me.user) return;
    const r = await fetch(`/api/vault/list`, { credentials: "include" });
    if (r.ok) {
      const d = await r.json();
      setAssets(d.assets ?? []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File, kind: string) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    await fetch("/api/vault/upload", { method: "POST", body: fd, credentials: "include" });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">सबूत वॉल्ट</h1>
      <label className="block rounded-2xl bg-white p-4 shadow ring-1 ring-teal-900/10">
        <p className="mb-2 text-sm font-medium">फोटो अपलोड</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f, "SCREENSHOT");
          }}
        />
      </label>
      <ul className="space-y-2">
        {assets.map((a) => (
          <li key={a.id} className="rounded-xl bg-white p-3 text-sm shadow ring-1 ring-teal-900/10">
            <a className="text-teal-800 underline" href={`/api/vault/${a.id}`} target="_blank" rel="noreferrer">
              {a.fileName}
            </a>{" "}
            · {a.kind}
          </li>
        ))}
      </ul>
    </div>
  );
}
