import { CreatePlaylistForm } from "@/features/growth/components/create-playlist-form";
import { Suspense } from "react";

export default function NewPlaylistPage() {
  return (
    <main className="page-shell">
      <section className="panel p-6">
        <h1 className="text-3xl font-semibold">Yeni playlist</h1>
        <p className="mt-3 text-sm text-muted">Kataloğunuzdan oluşturacağınız playlisti public veya özel olarak kaydedin.</p>
      </section>
      <section className="panel p-6 md:p-8"><Suspense fallback={null}><CreatePlaylistForm /></Suspense></section>
    </main>
  );
}
