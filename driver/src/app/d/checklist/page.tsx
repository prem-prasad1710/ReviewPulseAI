"use client";

import { useState } from "react";
import { getComplianceChecklist, VEHICLE_LABELS, type VehicleKind } from "@/lib/compliance-checklist";

const kinds: VehicleKind[] = ["bike_taxi", "auto", "car", "lcv"];

export default function ChecklistPage() {
  const [vehicle, setVehicle] = useState<VehicleKind>("auto");
  const items = getComplianceChecklist(vehicle);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-teal-900">कागज़ चेकलिस्ट</h1>
      <p className="text-sm text-teal-900/75">गाड़ी के हिसाब से — RTO / ऐप से पहले चेक कर लें।</p>

      <select
        className="w-full rounded-2xl border border-teal-900/20 bg-white px-4 py-3 font-medium text-teal-900"
        value={vehicle}
        onChange={(e) => setVehicle(e.target.value as VehicleKind)}
      >
        {kinds.map((k) => (
          <option key={k} value={k}>
            {VEHICLE_LABELS[k]}
          </option>
        ))}
      </select>

      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className={`rounded-2xl border p-4 ${it.mandatory ? "border-teal-200 bg-white" : "border-teal-900/10 bg-teal-50/50"}`}
          >
            <p className="font-bold text-teal-900">
              {it.labelHi}
              {it.mandatory ? <span className="ml-2 text-xs text-red-600">ज़रूरी</span> : <span className="ml-2 text-xs text-teal-700">सलाह</span>}
            </p>
            <p className="mt-1 text-sm text-teal-900/85">{it.detailHi}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
