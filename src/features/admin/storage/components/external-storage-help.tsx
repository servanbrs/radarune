export function ExternalStorageHelp() {
  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="font-semibold text-foreground">Harici depolama seçenekleri</h2>
      <p className="mt-1 text-sm leading-6 text-muted">Radarune, VPS üzerindeki Local Storage’ın yanında S3 uyumlu servislerle de çalışır.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["Amazon S3", "Cloudflare R2", "DigitalOcean Spaces", "MinIO / başka VPS"].map((name) => <div className="rounded-2xl border border-line bg-surface-strong p-4 text-sm font-semibold" key={name}>{name}</div>)}
      </div>
      <p className="mt-5 rounded-xl border border-line bg-surface-strong p-3 text-xs leading-5 text-muted">Kurulum için <code>STORAGE_PROVIDER</code>, <code>STORAGE_S3_BUCKET</code>, <code>STORAGE_S3_ACCESS_KEY_ID</code>, <code>STORAGE_S3_SECRET_ACCESS_KEY</code> ve gerekiyorsa <code>STORAGE_S3_ENDPOINT</code> değişkenlerini sunucunun .env dosyasına ekleyin. Secret değerleri panele veya istemciye gönderilmez.</p>
    </section>
  );
}
