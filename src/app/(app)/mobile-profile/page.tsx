import Link from "next/link";
import { BarChart3, ChevronRight, CircleUserRound, LayoutDashboard, LockKeyhole, Music2, Settings, ShieldCheck } from "lucide-react";

import { canAccessAdmin, toAdminActor } from "@/features/admin/server/admin-context";
import { SignOutButton } from "@/features/authentication/components/sign-out-button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { creatorAccessService } from "@/features/authorization/server/creator-access.service";

export const metadata = { title: "Profil merkezi | Radarune", description: "Radarune mobil profil, hesap ve üretici araçları." };

export default async function MobileProfilePage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const creatorAccess = creatorAccessService.getAccess({ systemRole: user.systemRole });
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const adminAccess = canAccessAdmin(actor);
  const accountLinks = [
    { href: "/settings", label: "Profil ve hesap ayarları", description: "Ad, kullanıcı adı, dil ve hesap bilgileri", icon: Settings },
    { href: "/settings#security", label: "Güvenlik", description: "Şifre, iki aşamalı doğrulama ve oturumlar", icon: LockKeyhole },
    { href: "/playlists", label: "Playlistlerim", description: "Kaydettiğin ve oluşturduğun listeler", icon: Music2 },
  ];
  const creatorLinks = [
    { href: "/dashboard", label: "Üretici paneli", description: "Yayınlar, sanatçılar ve çalışma alanı", icon: LayoutDashboard },
    ...(creatorAccess.isArtist || creatorAccess.isOrganizer ? [{ href: "/artist-profile", label: "Sanatçı / kanal profili", description: "Kapak, sosyal bağlantılar ve öne çıkanlar", icon: CircleUserRound }] : []),
    ...(creatorAccess.canViewAnalytics ? [{ href: "/analytics", label: "Detaylı analizler", description: "Dinlenme, ülke ve şehir bazlı performans", icon: BarChart3 }] : []),
  ];
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.18),transparent_28%),linear-gradient(180deg,#f6fffb,#f5f8f7)] px-4 pb-8 pt-5 sm:px-6 lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-2xl">
        <section className="overflow-hidden rounded-[2rem] bg-[#071612] p-6 text-white shadow-[0_24px_70px_rgba(4,24,20,0.2)] sm:p-8"><div className="flex items-center gap-4"><div className="flex size-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-[#54e7c2] to-[#087d70] text-2xl font-black text-[#06231b]">{user.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#54e7c2]">Radarune hesabı</p><h1 className="mt-1 truncate text-2xl font-black tracking-[-0.04em]">{user.name}</h1><p className="mt-1 truncate text-sm text-white/50">{user.email}</p></div></div><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/70">{user.systemRole === "USER" ? "Dinleyici" : user.systemRole}</span>{creatorAccess.isArtist ? <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">Sanatçı hesabı</span> : null}{creatorAccess.isOrganizer ? <span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-xs font-semibold text-orange-200">Organizasyon hesabı</span> : null}</div></section>
        <section className="mt-6"><p className="px-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#087d70]">Hesap</p><div className="mt-2 overflow-hidden rounded-[1.5rem] border border-black/[0.07] bg-white/85 shadow-sm">{accountLinks.map((item) => <ProfileLink item={item} key={item.href} />)}</div></section>
        {creatorLinks.length ? <section className="mt-6"><p className="px-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#087d70]">Üretici alanı</p><div className="mt-2 overflow-hidden rounded-[1.5rem] border border-black/[0.07] bg-white/85 shadow-sm">{creatorLinks.map((item) => <ProfileLink item={item} key={item.href} />)}</div></section> : null}
        {adminAccess ? <Link className="mt-6 flex items-center gap-3 rounded-[1.5rem] border border-orange-300/30 bg-orange-50 p-4 text-sm font-bold text-orange-900" href="/admin"><ShieldCheck className="size-5 text-orange-600" /> Yönetim panelini aç <ChevronRight className="ml-auto size-4" /></Link> : null}
        <div className="mt-6"><SignOutButton className="h-12 rounded-2xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100" /></div>
      </div>
    </main>
  );
}

function ProfileLink({ item }: { item: { href: string; label: string; description: string; icon: typeof Settings } }) {
  const Icon = item.icon;
  return <Link className="flex items-center gap-3 border-b border-black/[0.06] p-4 last:border-b-0 hover:bg-[#f3fbf7]" href={item.href}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f8f0] text-[#087d70]"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#101817]">{item.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.description}</span></span><ChevronRight className="size-4 shrink-0 text-[#9aa8a3]" /></Link>;
}
