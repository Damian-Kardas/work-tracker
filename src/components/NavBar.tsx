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
    <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
        <span className="text-lg font-semibold text-gray-900">
          Work Tracker
        </span>

        <button
          onClick={signOut}
          className="text-sm text-gray-500 transition hover:text-red-500"
        >
          Wyloguj
        </button>
      </div>

      <div className="mx-auto flex max-w-lg gap-2 px-2 pb-3">
        {links.map((l) => {
          const active = pathname === l.href;

          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 rounded-xl px-3 py-2 text-center text-sm transition ${
                active
                  ? "bg-
