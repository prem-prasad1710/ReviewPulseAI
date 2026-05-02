import type { Metadata } from "next";
import { DriverNav } from "@/components/DriverNav";

export const metadata: Metadata = {
  title: "DriverSaathi",
  description: "Hisaab, challan, loan safety — drivers ke liye",
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white pb-28 text-teal-950">
      <header className="sticky top-0 z-40 border-b border-teal-900/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-teal-800">DriverSaathi</span>
          <span className="text-xs text-teal-800/70">गिग ड्राइवर साथी</span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      <DriverNav />
    </div>
  );
}
