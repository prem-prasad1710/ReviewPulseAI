"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/d", label: "Home" },
  { href: "/d/hisaab", label: "Hisaab" },
  { href: "/d/wallet", label: "खर्च" },
  { href: "/d/paper", label: "Paper" },
  { href: "/d/more", label: "Aur" },
];

export function DriverNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-teal-900/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg justify-around gap-1 px-1 py-2 text-xs">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/d" && path.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex-1 rounded-xl px-1 py-2 text-center font-medium ${
                active ? "bg-teal-700 text-white" : "text-teal-900/80 hover:bg-teal-50"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
