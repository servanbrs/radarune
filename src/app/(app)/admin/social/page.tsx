import { AdminShell } from "@/features/admin/components/admin-shell";

export default function AdminSocialPage() {
  return (
    <AdminShell title="Social moderation" description="Yorum, story, playlist ve rapor moderasyonu AuditLog kapsamıyla yönetilir.">
      <section className="grid gap-4 md:grid-cols-2">
        {["Yorumlar", "Storyler", "Playlistler", "Raporlar"].map((item) => (
          <article className="panel p-6" key={item}>
            <h2 className="text-lg font-semibold">{item}</h2>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
