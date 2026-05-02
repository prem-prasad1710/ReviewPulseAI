"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone, displayName: name || undefined, city: city || undefined }),
    });
    if (!res.ok) {
      setErr("लॉगिन नहीं हुआ — नंबर चेक करें।");
      return;
    }
    router.push("/d");
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
      <h1 className="text-xl font-bold text-teal-900">लॉगिन</h1>
      <p className="text-sm text-teal-900/75">10 अंकों का मोबाइल (भारत)। डेमो: 9999999999</p>
      <form className="space-y-3" onSubmit={submit}>
        <label className="block text-sm font-medium text-teal-900">
          मोबाइल
          <input
            className="mt-1 w-full rounded-xl border border-teal-900/20 px-3 py-3 text-lg outline-none ring-teal-600 focus:ring-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            inputMode="numeric"
            required
          />
        </label>
        <label className="block text-sm font-medium text-teal-900">
          नाम (optional)
          <input
            className="mt-1 w-full rounded-xl border border-teal-900/20 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-teal-900">
          शहर (optional)
          <input
            className="mt-1 w-full rounded-xl border border-teal-900/20 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Delhi"
          />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-700 py-3 text-lg font-semibold text-white active:bg-teal-800"
        >
          आगे
        </button>
      </form>
    </div>
  );
}
