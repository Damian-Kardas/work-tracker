"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "Bledny email lub haslo." : error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setInfo("Konto utworzone. Sprawdz skrzynke email, aby potwierdzic rejestracje.");
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-mono text-2xl font-semibold text-paper-100">Czas pracy</h1>
        <p className="mb-8 text-sm text-paper-500">
          {mode === "signin" ? "Zaloguj sie do swojego konta." : "Zaloz nowe konto."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-paper-500" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-card border border-ink-700 bg-ink-800 px-3 py-2 text-paper-100 outline-none focus:border-amber-500"
              placeholder="ty@firma.pl"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-paper-500" htmlFor="password">
              Haslo
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-card border border-ink-700 bg-ink-800 px-3 py-2 text-paper-100 outline-none focus:border-amber-500"
              placeholder="min. 6 znakow"
            />
          </div>

          {error && <p className="text-sm text-brick-400">{error}</p>}
          {info && <p className="text-sm text-moss-400">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-card bg-amber-500 py-2.5 font-medium text-ink-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Chwileczke..." : mode === "signin" ? "Zaloguj sie" : "Zaloz konto"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="mt-5 w-full text-center text-sm text-paper-500 hover:text-paper-100"
        >
          {mode === "signin" ? "Nie masz konta? Zaloz je" : "Masz juz konto? Zaloguj sie"}
        </button>
      </div>
    </div>
  );
}
