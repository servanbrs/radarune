"use client";

import { useState } from "react";
import { Upload, Music2, CheckCircle } from "lucide-react";

export default function UploadAudio({
  next,
}: {
  next: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleFile = (selectedFile: File) => {
    setError("");

    const extension = selectedFile.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (extension !== "wav") {
      setError("Sadece WAV formatı kabul edilmektedir.");
      return;
    }

    setFile(selectedFile);
  };

  return (
    <div>

      <h2 className="text-3xl font-bold">
        Ses Dosyası
      </h2>

      <p className="mt-3 text-zinc-500">
        ONErpm standartlarına uygun WAV dosyanı yükle.
      </p>

      <label
        htmlFor="audio-upload"
        className="mt-8 flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-violet-500/30 bg-white/[0.02] p-10 text-center transition hover:border-violet-500/60"
      >
        {!file ? (
          <>
            <Upload size={60} />

            <p className="mt-6 text-2xl font-semibold">
              WAV Dosyanı Buraya Sürükle
            </p>

            <p className="mt-3 text-zinc-500">
              veya dosya seçmek için tıkla
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 p-4 text-sm text-zinc-400">
              ✓ WAV formatı zorunlu
              <br />
              ✓ 24 Bit önerilir
              <br />
              ✓ 44.1kHz veya 48kHz
              <br />
              ✓ Master dosya yükleyin
            </div>
          </>
        ) : (
          <>
            <CheckCircle
              size={64}
              className="text-green-500"
            />

            <p className="mt-5 text-2xl font-semibold">
              Dosya Hazır
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 px-5 py-3">
              <Music2 size={20} />

              <span className="text-zinc-300">
                {file.name}
              </span>
            </div>
          </>
        )}

        <input
          id="audio-upload"
          type="file"
          accept=".wav,audio/wav"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];

            if (!selected) return;

            handleFile(selected);
          }}
        />
      </label>

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <button
        disabled={!file}
        onClick={next}
        className={`mt-10 rounded-full px-8 py-4 font-semibold transition ${
          file
            ? "bg-violet-600 hover:bg-violet-500"
            : "cursor-not-allowed bg-zinc-800 text-zinc-500"
        }`}
      >
        Devam Et
      </button>

    </div>
  );
}