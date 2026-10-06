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
    <header className="sticky top-0 z-50 bg-[#1d1d1f]/80 backdrop-blur-md border-b border-[#e0e0e0]">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 h-12">
        <span className="font-semibold text-white text-sm tracking-tight">
          WorkTracker
        </span>
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  active
                    ? "bg-[#0066cc] text-white"
                    : "text-[#86868b] hover:text-white hover:bg-white/5"
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
