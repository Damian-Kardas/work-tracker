"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Panel" },
  { href: "/stats", label: "Statystyki" },
  { href: "/leave", label: "Urlopy" },
  { href: "/history", label: "Historia" },
  { href: "/settings", label: "Ustawienia" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#f5f5f7]/90 backdrop-blur-xl border-b border-[#d2d2d7]">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 h-11">
        <span className="font-semibold text-[#1d1d1f] text-xs tracking-tight">
          WT
        </span>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 text-[11px] sm:text-xs font-normal rounded-full transition-colors ${
                  active
                    ? "bg-[#0066cc] text-white font-medium"
                    : "text-[#1d1d1f] hover:bg-black/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
