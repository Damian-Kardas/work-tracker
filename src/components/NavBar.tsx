"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 bg-void">
      <div
        className="mx-auto flex h-11 max-w-lg items-center justify-between px-4"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <span className="text-xs font-normal tracking-tight text-white">Czas pracy</span>
        <button
          onClick={signOut}
          className="press-scale rounded-sm bg-white/10 px-3 py-1 text-xs text-white"
        >
          Wyloguj
        </button>
      </div>
    </header>
  );
}
