"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = {
  user: {
    phone: string;
    displayName: string | null;
    city: string | null;
    subscriptionTier: string;
    freeChecksUsed: number;
    _count: {
      earningsChecks: number;
      vaultAssets: number;
      reminders: number;
      expenses: number;
      tickets: number;
    };
  } | null;
};

export default function DriverHome() {
  const [me, setMe] = useState<Me["user"] | undefined>(undefined);
  const [score, setScore] = useState<{ score: number } | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: Me) => setMe(d.user ?? null));
    fetch("/api/score", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setScore(d));
  }, []);

  if (me === undefined) {
    return <p className="text-center text-teal-800/80">लोड हो रहा है…</p>;
  }
  if (me === null) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
        <h1 className="text-xl font-bold text-teal-900">पहले लॉगिन करें</h1>
        <p className="text-sm text-teal-900/80">मोबाइल नंबर से शुरू करें (डेमो के लिए)।</p>
        <Link
          href="/d/login"
          className="block rounded-xl bg-teal-700 py-3 text-center font-semibold text-white"
        >
          लॉगिन
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
        <p className="text-sm text-teal-800/70">नमस्ते</p>
        <p className="text-2xl font-bold text-teal-900">{me.displayName ?? "ड्राइवर"}</p>
        <p className="text-sm text-teal-800/80">
          {me.city ?? "शहर जोड़ें"} · {me.phone}
        </p>
        {score && (
          <div className="mt-4 rounded-xl bg-teal-700 px-4 py-3 text-white">
            <p className="text-xs uppercase tracking-wide opacity-90">Confidence Score</p>
            <p className="text-3xl font-black">{score.score}/100</p>
            <Link href="/d/score" className="mt-2 inline-block text-sm underline">
              विवरण देखें
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile href="/d/hisaab" title="आज का हिसाब" subtitle="कमाई चेक" />
        <Tile href="/d/wallet" title="खर्च बुक" subtitle="फ्यूल, EMI" />
        <Tile href="/d/challan" title="चालान" subtitle="समझ + स्टेप" />
        <Tile href="/d/loan" title="लोन सेफ्टी" subtitle="लाल झंडे" />
        <Tile href="/d/paper" title="कागज़" subtitle="याद दिलाना" />
        <Tile href="/d/checklist" title="चेकलिस्ट" subtitle="RC, PUC…" />
        <Tile href="/d/scam" title="फेक मैसेज?" subtitle="जाँच" />
        <Tile href="/d/vault" title="वॉल्ट" subtitle="फोटो सेव" />
        <Tile href="/d/support" title="शिकायत" subtitle="टेम्पलेट" />
        <Tile href="/d/community" title="चेतावनी" subtitle="समुदाय" />
      </div>

      <div className="rounded-2xl bg-white p-4 text-sm text-teal-900/80 shadow-sm ring-1 ring-teal-900/10">
        <p className="font-semibold text-teal-900">आँकड़े</p>
        <p>हिसाब चेक: {me._count.earningsChecks}</p>
        <p>वॉल्ट फाइल: {me._count.vaultAssets}</p>
        <p>रिमाइंडर: {me._count.reminders}</p>
        <p>खर्च एंट्री: {me._count.expenses}</p>
        <p>टिकट: {me._count.tickets}</p>
        <p>फ्री चेक इस्तेमाल: {me.freeChecksUsed}/5 (फ्री टियर)</p>
        <p className="mt-2 text-xs">प्लान: {me.subscriptionTier}</p>
      </div>
    </div>
  );
}

function Tile({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/10 active:scale-[0.98]"
    >
      <p className="font-bold text-teal-900">{title}</p>
      <p className="text-xs text-teal-800/70">{subtitle}</p>
    </Link>
  );
}
