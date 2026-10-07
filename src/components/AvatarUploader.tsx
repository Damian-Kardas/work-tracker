"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AvatarUploader({
  userId,
  avatarUrl,
  initial,
  onUploaded,
}: {
  userId: string;
  avatarUrl: string | null;
  initial: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Wybierz plik graficzny.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Maksymalny rozmiar to 5 MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError(`Nie udało się wgrać zdjęcia: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    // doklej znacznik czasu, zeby przegladarka nie pokazywala starej wersji z cache
    const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: freshUrl })
      .eq("id", userId);

    if (updateError) {
      setError(`Zdjęcie wgrane, ale nie udało się zapisać profilu: ${updateError.message}`);
      setUploading(false);
      return;
    }

    onUploaded(freshUrl);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="Twój awatar" className="h-16 w-16 rounded-full border border-hairline object-cover" />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-ink-muted-48 to-ink-muted-80 text-[20px] font-semibold text-white">
          {initial}
        </span>
      )}

      <div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="press-scale rounded-pill border border-hairline px-4 py-2 text-[13px] font-medium text-ink-muted-80 disabled:opacity-60"
        >
          {uploading ? "Wgrywanie…" : avatarUrl ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
      </div>
    </div>
  );
}
