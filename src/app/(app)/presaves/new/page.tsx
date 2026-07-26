export default function NewPreSavePage() {
  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Pre-save</p>
        <h1 className="mt-3 text-3xl font-semibold">Yeni Pre-save kampanyası</h1>
        <p className="mt-3 text-sm text-muted">API: <code>/api/growth/presaves</code>. Gerçek OAuth yoksa provider başarı sonucu üretilmez.</p>
      </section>
    </main>
  );
}
