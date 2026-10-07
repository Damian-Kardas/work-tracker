"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const [initial, setInitial] = useState("?");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const source = data.user?.email ?? "";
      if (source) setInitial(source[0].toUpperCase());
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", data.user.id)
          .single();
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      }
    });
  }, []);

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

        <Link href="/settings" title="Ustawienia i profil" className="press-scale">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Twój awatar"
              className="h-9 w-9 rounded-full border border-hairline object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ink-muted-48 to-ink-muted-80 text-[13px] font-semibold text-white">
              {initial}
            </span>
          )}
        </Link>
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
