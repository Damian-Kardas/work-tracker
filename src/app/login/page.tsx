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
    <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">
        <h1 className="display mb-1 text-[28px] font-semibold text-ink">Czas pracy</h1>
        <p className="mb-8 text-[15px] text-ink-muted-48">
          {mode === "signin" ? "Zaloguj się do swojego konta." : "Załóż nowe konto."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] text-ink-muted-48" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-[15px] text-ink outline-none focus:border-primary"
              placeholder="ty@firma.pl"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] text-ink-muted-48" htmlFor="password">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2.5 text-[15px] text-ink outline-none focus:border-primary"
              placeholder="min. 6 znakow"
            />
          </div>

          {error && <p className="text-[13px] text-danger">{error}</p>}
          {info && <p className="text-[13px] text-primary">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="press-scale w-full rounded-pill bg-primary py-3 text-[15px] font-medium text-white disabled:opacity-60"
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
          className="mt-5 w-full text-center text-[14px] text-primary"
        >
          {mode === "signin" ? "Nie masz konta? Załóż je" : "Masz już konto? Zaloguj się"}
        </button>
      </div>
    </div>
  );
}
