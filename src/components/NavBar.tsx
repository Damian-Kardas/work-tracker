"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Dziś" },
  { href: "/history", label: "Historia" },
  { href: "/stats", label: "Statystyki" },
  { href: "/leave", label: "Urlop" },
  { href: "/settings", label: "Ustawienia" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-ink-700 bg-ink-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <span className="font-mono text-sm font-semibold tracking-tight text-paper-100">
          Czas pracy
        </span>

        <button
          onClick={signOut}
          className="text-xs text-paper-500 transition-colors hover:text-brick-400"
        >
          Wyloguj
        </button>
      </div>

      <div className="mx-auto flex max-w-lg gap-1 px-2 pb-2">
        {links.map((l) => {
          const active = pathname === l.href;

          return (
            <Link
              key={l.href}
              href={l.href}
              className={`min-w-0 flex-1 rounded-card px-2 py-2 text-center text-xs transition-colors ${
                active
  
