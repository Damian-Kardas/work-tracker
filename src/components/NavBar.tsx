"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const router = useRouter();
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const source = data.user?.email ?? "";
      if (source) setInitial(source[0].toUpperCase());
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/90 backdrop-blur-xl">
      <div
        className="mx-auto flex h-16 max-w-lg items-center justify-between px-4"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary-on-dark to-primary text-white">
            <IconClock />
          </span>
          <span className="text-[14px] font-bold uppercase tracking-wide text-primary">
            Work Tracker
          </span>
        </div>

        <button
          onClick={signOut}
          title="Wyloguj"
          className="press-scale flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ink-muted-48 to-ink-muted-80 text-[13px] font-semibold text-white"
        >
          {initial}
        </button>
      </div>
    </header>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v4.8l3.3 1.9" />
    </svg>
  );
}
