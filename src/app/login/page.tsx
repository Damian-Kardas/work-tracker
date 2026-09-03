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
        setError(error.message === "Invalid login credentials" ? "Błędny email lub hasło." : error.message);
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
        setInfo("Konto utworzone. Sprawdź skrzynkę email, aby potwierdzić rejestrację.");
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-mono text-2xl font-semibold text-paper-100">Czas pracy</h1>
        <p className="mb-8 text-sm text-paper-500">
          {mode === "signin" ? "Zaloguj się do swojego konta." : "Załóż nowe konto."}
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
              Hasło
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
            {loading ? "Chwileczkę..." : mode === "signin" ? "Zaloguj się" : "Załóż konto"}
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
          {mode === "signin" ? "Nie masz konta? Załóż je" : "Masz już konto? Zaloguj się"}
        </button>
      </div>
    </div>
  );
}
