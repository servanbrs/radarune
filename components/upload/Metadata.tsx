"use client";

import { useState } from "react";

export default function Metadata() {
  const [trackTitle, setTrackTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitRelease() {
    if (!trackTitle || !artistName || !genre || !language) {
      alert("Zorunlu alanları doldur.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/releases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackTitle,
          artistName,
          genre,
          language,
          explicit,
        }),
      });

      if (!response.ok) {
        throw new Error("API Error");
      }

      alert("Yayın başarıyla gönderildi.");

      setTrackTitle("");
      setArtistName("");
      setGenre("");
      setLanguage("");
      setExplicit(false);
    } catch (error) {
      console.error(error);
      alert("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold">
        Yayın Bilgileri
      </h2>

      <p className="mt-3 text-zinc-500">
        Şarkının dağıtıma gönderilmesi için gerekli bilgileri doldurun.
      </p>

      <div className="mt-10 grid gap-6">

        <input
          value={trackTitle}
          onChange={(e) => setTrackTitle(e.target.value)}
          placeholder="Şarkı Adı *"
          className="rounded-2xl bg-white/5 p-5 outline-none"
        />

        <input
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="Sanatçı Adı *"
          className="rounded-2xl bg-white/5 p-5 outline-none"
        />

        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-2xl bg-white/5 p-5"
        >
          <option value="">Tür Seç *</option>
          <option>Deep House</option>
          <option>House</option>
          <option>Tech House</option>
          <option>Pop</option>
          <option>Rap</option>
          <option>Rock</option>
          <option>Electronic</option>
          <option>Techno</option>
        </select>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-2xl bg-white/5 p-5"
        >
          <option value="">Dil Seç *</option>
          <option>Türkçe</option>
          <option>İngilizce</option>
          <option>Arapça</option>
          <option>Enstrümantal</option>
        </select>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 p-5">
          <div>
            <h3 className="font-semibold">
              Explicit İçerik
            </h3>

            <p className="text-sm text-zinc-500">
              Küfür veya yetişkin içerik bulunuyor mu?
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExplicit(!explicit)}
            className={`h-8 w-16 rounded-full ${
              explicit
                ? "bg-violet-600"
                : "bg-zinc-700"
            }`}
          >
            <div
              className={`h-8 w-8 rounded-full bg-white transition ${
                explicit
                  ? "translate-x-8"
                  : ""
              }`}
            />
          </button>
        </div>

        <button
          onClick={submitRelease}
          disabled={loading}
          className="rounded-full bg-violet-600 py-5 text-lg font-semibold"
        >
          {loading
            ? "Gönderiliyor..."
            : "Yayını İncelemeye Gönder"}
        </button>

      </div>
    </div>
  );
}