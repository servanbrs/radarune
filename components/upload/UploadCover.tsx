"use client";

import { useState } from "react";
import { Upload, ImageIcon, CheckCircle } from "lucide-react";

export default function UploadCover({
  next,
}: {
  next: () => void;
}) {
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleCover = (file: File) => {
    setError("");

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      extension !== "jpg" &&
      extension !== "jpeg" &&
      extension !== "png"
    ) {
      setError("Sadece JPG veya PNG yükleyebilirsiniz.");
      return;
    }

    const img = new Image();

    img.onload = () => {
      if (img.width !== 3000 || img.height !== 3000) {
        setError(
          `Kapak görseli 3000x3000 olmalıdır. Yüklenen görsel: ${img.width}x${img.height}`
        );
        return;
      }

      setCover(file);
    };

    img.src = URL.createObjectURL(file);
  };

  return (
    <div>

      <h2 className="text-3xl font-bold">
        Kapak Görseli
      </h2>

      <p className="mt-3 text-zinc-500">
        ONErpm standartlarına uygun kapak yükleyin.
      </p>

      <label
        htmlFor="cover-upload"
        className="mt-8 flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-violet-500/30 bg-white/[0.02] p-10 text-center transition hover:border-violet-500/60"
      >
        {!cover ? (
          <>
            <Upload size={60} />

            <p className="mt-6 text-2xl font-semibold">
              Kapak Görselini Yükle
            </p>

            <p className="mt-3 text-zinc-500">
              PNG veya JPG dosyası seç
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 p-4 text-sm text-zinc-400">
              ✓ Tam olarak 3000x3000 px
              <br />
              ✓ JPG veya PNG
              <br />
              ✓ Logo, fiyat, telefon numarası olmamalı
              <br />
              ✓ Profesyonel kapak tasarımı önerilir
            </div>
          </>
        ) : (
          <>
            <CheckCircle
              size={64}
              className="text-green-500"
            />

            <p className="mt-5 text-2xl font-semibold">
              Kapak Hazır
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 px-5 py-3">
              <ImageIcon size={20} />

              <span className="text-zinc-300">
                {cover.name}
              </span>
            </div>
          </>
        )}

        <input
          id="cover-upload"
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];

            if (!selected) return;

            handleCover(selected);
          }}
        />
      </label>

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <button
        disabled={!cover}
        onClick={next}
        className={`mt-10 rounded-full px-8 py-4 font-semibold transition ${
          cover
            ? "bg-violet-600 hover:bg-violet-500"
            : "cursor-not-allowed bg-zinc-800 text-zinc-500"
        }`}
      >
        Devam Et
      </button>

    </div>
  );
}