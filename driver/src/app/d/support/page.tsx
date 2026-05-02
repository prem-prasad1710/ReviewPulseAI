"use client";

import { useCallback, useEffect, useState } from "react";
import { SUPPORT_TEMPLATES, type SupportTemplateKey } from "@/lib/support-templates";

type Ticket = {
  id: string;
  platform: string | null;
  templateKey: string | null;
  body: string;
  status: string;
  nextAt: string | null;
  createdAt: string;
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [platform, setPlatform] = useState("UBER");
  const [templateKey, setTemplateKey] = useState<SupportTemplateKey>("payout_discrepancy");
  const [body, setBody] = useState(SUPPORT_TEMPLATES[0].bodyHi);
  const [status, setStatus] = useState("draft");

  const load = useCallback(async () => {
    const r = await fetch("/api/tickets", { credentials: "include" });
    const d = await r.json();
    setTickets(d.tickets ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = SUPPORT_TEMPLATES.find((x) => x.key === templateKey);
    if (t) setBody(t.bodyHi);
  }, [templateKey]);

  async function save() {
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ platform, templateKey, body, status }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/tickets/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  async function patch(id: string, next: Partial<Ticket>) {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(next),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">शिकायत ड्राफ्ट</h1>
      <p className="text-sm text-teal-900/75">टेम्पलेट चुनें, एडिट करें, सेव करें — ऐप सपोर्ट में भेजने के लिए।</p>

      <div className="space-y-2 rounded-2xl bg-white p-4 shadow ring-1 ring-teal-900/10">
        <label className="block text-sm font-medium">प्लेटफ़ॉर्म</label>
        <select className="w-full rounded-xl border px-3 py-2" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          {["UBER", "OLA", "RAPIDO", "OTHER"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium">टेम्पलेट</label>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value as SupportTemplateKey)}
        >
          {SUPPORT_TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.titleHi}
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium">मैसेज</label>
        <textarea className="h-48 w-full rounded-xl border p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
        <label className="block text-sm font-medium">स्टेटस</label>
        <select className="w-full rounded-xl border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">ड्राफ्ट</option>
          <option value="sent">भेज दिया</option>
          <option value="waiting">जवाब का इंतज़ार</option>
        </select>
        <button type="button" onClick={save} className="w-full rounded-xl bg-teal-700 py-3 font-semibold text-white">
          सेव करें
        </button>
      </div>

      <h2 className="font-bold text-teal-900">पुराने</h2>
      <ul className="space-y-2">
        {tickets.map((t) => (
          <li key={t.id} className="rounded-xl bg-white p-3 text-sm shadow ring-1 ring-teal-900/10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {t.platform ?? "—"} · {t.status}
                </p>
                <p className="mt-1 line-clamp-3 text-teal-900/80">{t.body}</p>
                <p className="mt-1 text-xs text-teal-700/70">{new Date(t.createdAt).toLocaleString("hi-IN")}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  className="rounded border border-teal-600 px-2 py-1 text-xs text-teal-800"
                  onClick={() => patch(t.id, { status: t.status === "sent" ? "waiting" : "sent" })}
                >
                  स्टेटस
                </button>
                <button type="button" className="rounded border border-red-200 px-2 py-1 text-xs text-red-700" onClick={() => remove(t.id)}>
                  हटाओ
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
