import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Klient z kluczem service_role - omija RLS. Uzywac WYLACZNIE w kodzie
 * uruchamianym po stronie serwera (np. route handlery wywolywane przez cron),
 * nigdy w komponentach klienckich.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
