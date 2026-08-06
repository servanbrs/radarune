import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";
import { saveWhatsappAction } from "@/features/admin/server/actions/whatsapp.actions";
import { WhatsappTestButton } from "@/features/integrations/components/whatsapp-test-button";

export default async function AdminWhatsappPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const config = await integrationCredentialService.whatsapp(actor.organizationId);
  return (
    <AdminShell title="WhatsApp bildirimleri" description="Yeni yayın geldiğinde admin numaralarına Meta WhatsApp Cloud API üzerinden şablon mesaj gönderin.">
      <section className="panel p-6">
        <div className={`rounded-2xl border p-4 ${config ? "border-emerald-300/30 bg-emerald-50 text-emerald-950" : "border-amber-300/30 bg-amber-50 text-amber-950"}`}>
          <p className="text-xs font-bold uppercase tracking-[0.18em]">WhatsApp bağlantı durumu</p>
          <p className="mt-2 text-lg font-semibold">{config ? "Bağlı ve yapılandırıldı" : "Henüz yapılandırılmadı"}</p>
          {config ? <div className="mt-2 grid gap-1 text-sm"><span>Telefon ID: {config.phoneNumberId}</span><span>Alıcılar: {config.recipients?.split(/[\n,]+/).filter(Boolean).length ?? 0} numara</span><span>Şablon: {config.templateName} · {config.templateLanguage}</span></div> : <p className="mt-1 text-sm">Bilgileri kaydettiğinizde bu alanda bağlantı özeti görünecek.</p>}
        </div>
        <div className="rounded-2xl border border-amber-300/30 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Meta tarafından onaylanmış bir WhatsApp mesaj şablonu ve gönderim izni gerekir. Token sunucuda şifreli saklanır; alıcılar ülke koduyla birlikte girilmelidir: <strong>905xxxxxxxxx</strong>.
        </div>
        <form action={saveWhatsappAction} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Telefon numarası ID<input className="rounded-xl border border-line bg-background px-4 py-3" defaultValue={config?.phoneNumberId ?? ""} name="phoneNumberId" placeholder="Meta WhatsApp Phone Number ID" required /></label>
            <label className="grid gap-2 text-sm font-medium">Business Account ID<input className="rounded-xl border border-line bg-background px-4 py-3" defaultValue={config?.businessAccountId ?? ""} name="businessAccountId" placeholder="WABA ID" /></label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">Kalıcı Access Token<input className="rounded-xl border border-line bg-background px-4 py-3" name="accessToken" placeholder={config ? "Değiştirmeyecekseniz boş bırakmayın; mevcut tokenı koruyun" : "Meta System User access token"} required={!config} type="password" /></label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">Bildirim alacak numaralar<textarea className="min-h-24 rounded-xl border border-line bg-background px-4 py-3" defaultValue={config?.recipients ?? ""} name="recipients" placeholder="905xxxxxxxxx\n905yyyyyyyyy" required /></label>
            <label className="grid gap-2 text-sm font-medium">Şablon adı<input className="rounded-xl border border-line bg-background px-4 py-3" defaultValue={config?.templateName ?? "radarune_new_release"} name="templateName" required /></label>
            <label className="grid gap-2 text-sm font-medium">Şablon dili<input className="rounded-xl border border-line bg-background px-4 py-3" defaultValue={config?.templateLanguage ?? "tr"} name="templateLanguage" required /></label>
          </div>
          <p className="text-xs leading-5 text-muted">Şablonda iki değişken tanımlayın: <code>{"{{1}}"}</code> yayın adı, <code>{"{{2}}"}</code> yayın bağlantısı.</p>
          <button className="w-fit rounded-xl bg-accent px-5 py-3 font-semibold text-accent-foreground" type="submit">WhatsApp ayarlarını kaydet</button>
          {config ? <WhatsappTestButton /> : null}
        </form>
      </section>
      <section className="panel mt-5 p-6"><h2 className="text-lg font-semibold">Bildirim kuralları</h2><div className="mt-4 grid gap-3 text-sm leading-6 text-muted"><p><strong className="text-foreground">Aktif:</strong> Yeni yayın oluşturulduğunda admin alıcılarına “Yeni yayın geldi” mesajı gönderilir. Mesajda yayın adı ve Radarune yayın bağlantısı bulunur.</p><p><strong className="text-foreground">Test:</strong> Test butonu kayıtlı alıcılar listesindeki ilk numaraya “Radarune test mesajı / WhatsApp bağlantısı çalışıyor.” içeriğini yollar.</p><p><strong className="text-foreground">Gönderilmez:</strong> Taslak güncellemeleri, her metadata değişikliği ve kullanıcı etkileşimleri için gereksiz mesaj gönderilmez. İstersen ileride onaylandı, dağıtıma alındı veya hata durumlarını ayrı ayrı açabiliriz.</p></div></section>
    </AdminShell>
  );
}
