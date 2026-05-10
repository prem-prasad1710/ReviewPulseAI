"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MorePage() {
  const router = useRouter();
  const [isLocal, setIsLocal] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setIsLocal(typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"));
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setName(d.user.displayName ?? "");
          setCity(d.user.city ?? "");
        }
      });
  }, []);

  async function saveProfile() {
    setMsg("");
    const r = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ displayName: name || null, city: city || null }),
    });
    if (r.ok) setMsg("प्रोफ़ाइल सेव।");
    else setMsg("सेव नहीं हुआ — लॉगिन चेक करें।");
  }

  async function setTier(tier: "FREE" | "PRO") {
    setMsg("");
    const r = await fetch("/api/me/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });
    const d = await r.json();
    if (r.ok) setMsg(`प्लान: ${d.user.subscriptionTier}`);
    else setMsg(d.error ?? "नहीं चला");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/d/login");
  }

  const links = [
    { href: "/d/challan", label: "चालान" },
    { href: "/d/loan", label: "लोन सेफ्टी" },
    { href: "/d/scam", label: "फेक मैसेज?" },
    { href: "/d/vault", label: "वॉल्ट" },
    { href: "/d/score", label: "स्कोर" },
    { href: "/d/support", label: "शिकायत ड्राफ्ट" },
    { href: "/d/checklist", label: "कागज़ लिस्ट" },
    { href: "/d/community", label: "चेतावनी बोर्ड" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">और</h1>

      <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-teal-900/10">
        <p className="font-semibold text-teal-900">प्रोफ़ाइल</p>
        <input className="mt-2 w-full rounded-xl border px-3 py-2" placeholder="नाम" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="mt-2 w-full rounded-xl border px-3 py-2" placeholder="शहर" value={city} onChange={(e) => setCity(e.target.value)} />
        <button type="button" onClick={saveProfile} className="mt-2 w-full rounded-xl bg-teal-700 py-2 font-semibold text-white">
          सेव
        </button>
        {msg && <p className="mt-2 text-sm text-teal-800">{msg}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-xl bg-white py-3 text-center text-sm font-semibold text-teal-900 shadow ring-1 ring-teal-900/10">
            {l.label}
          </Link>
        ))}
      </div>

      {isLocal && (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Dev only</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="rounded-lg bg-teal-700 px-3 py-1 text-white" onClick={() => setTier("PRO")}>
              Pro
            </button>
            <button type="button" className="rounded-lg border border-teal-700 px-3 py-1" onClick={() => setTier("FREE")}>
              Free
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-teal-900/10">
        <p className="text-sm text-teal-900/80">WhatsApp: `/api/webhooks/whatsapp` — Meta टोकन `.env` में।</p>
      </div>

      <button
        type="button"
        onClick={logout}
        className="w-full rounded-xl border border-red-200 py-3 font-semibold text-red-700"
      >
        लॉगआउट
      </button>
    </div>
  );
}
