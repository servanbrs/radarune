import { Globe2, MessageCircle, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";
import { saveSocialAuthProviderAction } from "@/features/admin/server/actions/social-auth.actions";

export default async function AdminSocialPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const providers = await integrationCredentialService.listSocial(actor);
  const google = providers.find((provider) => provider.provider === "GOOGLE_OAUTH")!;
  const facebook = providers.find((provider) => provider.provider === "FACEBOOK_OAUTH")!;

  return (
    <AdminShell title="Sosyal giriş ve moderasyon" description="Google ve Facebook OAuth bilgilerini artık env dosyasına girmeden bu panelden şifreli olarak yönetin.">
      <section className="rounded-[28px] bg-[#101817] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
        <div className="flex items-start gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-300 text-[#08201a]"><ShieldCheck className="size-6" /></span><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Auth control</p><h1 className="mt-2 text-2xl font-black tracking-[-0.04em]">Giriş seçeneklerini merkezden yönet.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Credential değerleri AES-GCM ile şifrelenir, istemciye veya loglara gönderilmez. Kaydettikten sonra giriş/kayıt sayfalarında ilgili buton görünür.</p></div></div>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <SocialProviderCard provider="GOOGLE_OAUTH" label="Google" icon="google" configured={google.hasCredentials} active={google.active} />
        <SocialProviderCard provider="FACEBOOK_OAUTH" label="Facebook" icon="facebook" configured={facebook.hasCredentials} active={facebook.active} />
      </section>
      <section className="mt-5 grid gap-4 md:grid-cols-2">
        {[["Yorumlar", "Topluluk yorumlarını, yanıtları ve görünürlük durumlarını yönetin."], ["Storyler", "Sanatçı ve yayın story içeriklerini inceleyin."], ["Playlistler", "Global playlist ve haftalık oy kampanyalarını yönetin."], ["Raporlar", "Kullanıcıların bildirdiği içerikleri değerlendirin."]].map(([title, note]) => <article className="rounded-2xl border border-black/[0.06] bg-white p-5" key={title}><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6d7975]">{note}</p></article>)}
      </section>
    </AdminShell>
  );
}

function SocialProviderCard({ provider, label, icon, configured, active }: { provider: "GOOGLE_OAUTH" | "FACEBOOK_OAUTH"; label: string; icon: "google" | "facebook"; configured: boolean; active: boolean }) {
  return <article className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-[0_14px_42px_rgba(15,23,42,0.05)]"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#eef5f1] text-[#087d70]">{icon === "facebook" ? <Globe2 className="size-5" /> : <MessageCircle className="size-5" />}</span><div><h2 className="font-bold">{label} OAuth</h2><p className="mt-1 text-xs text-[#76827e]">{active && configured ? "Aktif ve giriş ekranında kullanılabilir" : "Yapılandırma bekliyor"}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${active && configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{active && configured ? "Aktif" : "Pasif"}</span></div><form action={saveSocialAuthProviderAction} className="mt-6 grid gap-4"><input name="provider" type="hidden" value={provider} /><label className="text-sm font-semibold">Client ID<input className="mt-2 w-full rounded-xl border border-line bg-[#f7faf8] px-4 py-3 font-normal outline-none focus:border-emerald-500" name="clientId" placeholder={`${label} client ID`} required /></label><label className="text-sm font-semibold">Client Secret<input className="mt-2 w-full rounded-xl border border-line bg-[#f7faf8] px-4 py-3 font-normal outline-none focus:border-emerald-500" name="clientSecret" placeholder={configured ? "Değiştirmek istemiyorsanız boş bırakabilirsiniz" : `${label} client secret`} required={!configured} type="password" /></label><button className="w-fit rounded-xl bg-[#101817] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1d3932]" type="submit">{configured ? "OAuth ayarlarını güncelle" : "OAuth’ı etkinleştir"}</button></form></article>;
}
