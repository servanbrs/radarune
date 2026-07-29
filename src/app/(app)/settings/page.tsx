import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { ChangePasswordForm } from "@/features/authentication/components/change-password-form";
import { PrivacySettingsForm } from "@/features/authentication/components/privacy-settings-form";
import { AccountDeletionRequest } from "@/features/authentication/components/account-deletion-request";

const roleLabels: Record<string, string> = {
  USER: "Üye", ARTIST: "Sanatçı", ORGANIZER: "Organizatör", LABEL: "Label yöneticisi",
  LABEL_MANAGER: "Label yöneticisi", MODERATOR: "Moderatör", ADMIN: "Yönetici", SUPER_ADMIN: "Süper yönetici",
};

export default async function SettingsPage() {
  const { user } = await authSessionService.getDashboardContext();
  const role = roleLabels[String(user.systemRole)] ?? "Üye";
  const created = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(user.createdAt);

  return <main className="page-shell pb-24">
    <section className="panel overflow-hidden p-6 md:p-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs uppercase tracking-[0.28em] text-accent">Hesap merkezi</p><h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Hesap ayarları</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">Profilinizi, güvenliğinizi, gizlilik tercihlerinizi ve veri haklarınızı tek bir yerden yönetin.</p></div>
        <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-line bg-background/70 px-3 py-2">{role}</span><span className="rounded-full border border-line bg-background/70 px-3 py-2">{user.emailVerified ? "E-posta doğrulandı" : "E-posta doğrulanmadı"}</span></div>
      </div>
    </section>

    <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid content-start gap-6">
        <section className="panel p-6"><p className="text-xs uppercase tracking-[0.2em] text-muted">Profil</p><h2 className="mt-2 text-xl font-semibold">{user.name}</h2><p className="mt-1 text-sm text-muted">{user.email}</p><div className="mt-5 grid gap-3 rounded-2xl border border-line bg-background/50 p-4 text-sm"><div className="flex justify-between gap-3"><span className="text-muted">Kullanıcı adı</span><span className="font-medium">Profil sayfasından yönetilir</span></div><div className="flex justify-between gap-3"><span className="text-muted">Katılım</span><span className="font-medium">{created}</span></div></div><Link className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground" href="/artist-profile/edit">Profili düzenle →</Link></section>
        <section className="panel p-6"><p className="text-xs uppercase tracking-[0.2em] text-muted">Hızlı bağlantılar</p><div className="mt-4 grid gap-2"><Link className="rounded-xl border border-line px-4 py-3 text-sm font-medium transition hover:bg-background/70" href="/privacy">Gizlilik politikası <span className="float-right">→</span></Link><Link className="rounded-xl border border-line px-4 py-3 text-sm font-medium transition hover:bg-background/70" href="/terms">Kullanım koşulları <span className="float-right">→</span></Link><Link className="rounded-xl border border-line px-4 py-3 text-sm font-medium transition hover:bg-background/70" href="/contact">Destek ve iletişim <span className="float-right">→</span></Link></div></section>
      </div>
      <div className="grid content-start gap-6">
        <section className="panel p-6" id="security"><div><p className="text-xs uppercase tracking-[0.2em] text-muted">Güvenlik</p><h2 className="mt-2 text-xl font-semibold">Şifre ve oturumlar</h2><p className="mt-2 text-sm text-muted">Şifrenizi güncellediğinizde diğer açık oturumlar güvenlik için kapatılır.</p></div><ChangePasswordForm /></section>
        <section className="panel p-6"><p className="text-xs uppercase tracking-[0.2em] text-muted">Gizlilik</p><h2 className="mt-2 text-xl font-semibold">Veri ve bildirim tercihleri</h2><p className="mt-2 text-sm text-muted">Hangi içeriklerin ve bildirimlerin size gösterileceğini seçin.</p><PrivacySettingsForm /></section>
        <section className="panel border-danger/20 p-6"><p className="text-xs uppercase tracking-[0.2em] text-danger">Hesap verileri</p><h2 className="mt-2 text-xl font-semibold">Verilerinizi yönetin</h2><p className="mt-2 text-sm text-muted">Hesabınızla ilgili erişim veya silme talebinizi destek ekibine iletebilirsiniz.</p><AccountDeletionRequest /></section>
      </div>
    </div>
  </main>;
}
