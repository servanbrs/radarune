import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowUpRight, Clock3, Globe2, Headphones, Rocket, UserPlus, Users } from "lucide-react";
import type { AdminV2Analytics } from "@/features/admin/server/services/admin-v2-analytics.service";

const statusLabels: Record<string, string> = {
  PENDING: "Bekliyor", VALIDATING: "Doğrulanıyor", QUEUED: "Kuyrukta", PROCESSING: "İşleniyor",
  WAITING_PROVIDER: "Sağlayıcı bekleniyor", RETRY_SCHEDULED: "Tekrar denenecek", MANUAL_REVIEW: "Manuel inceleme",
};

function number(value: number) { return new Intl.NumberFormat("tr-TR").format(value); }

export function AdminAnalyticsDetail({ dashboard }: { dashboard: AdminV2Analytics }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary label="Toplam kullanıcı" value={dashboard.summary.totalUsers} icon={Users} />
        <Summary label="Aktif şimdi" value={dashboard.summary.activeUsers} icon={Activity} />
        <Summary label="Bugünkü kayıt" value={dashboard.summary.usersToday} icon={UserPlus} />
        <Summary label="Bugünkü oynatma" value={dashboard.summary.playbackToday} icon={Headphones} />
        <Summary label="Dağıtım kuyruğu" value={dashboard.summary.activeDistributionJobs} icon={Rocket} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel eyebrow="Canlı oturumlar" title="Aktif kullanıcılar ve maskeli IP görünümü" icon={Users}>
          <p className="mb-4 text-xs leading-5 text-muted">Son 15 dakikada işlem yapan oturumlar. Güvenlik nedeniyle IP adreslerinin son bölümü maskelenir.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-line text-xs text-muted"><tr><th className="pb-3">Kullanıcı</th><th className="pb-3">IP</th><th className="pb-3">Cihaz</th><th className="pb-3">Son hareket</th></tr></thead><tbody className="divide-y divide-line">{dashboard.details.activeSessions.map((session) => <tr key={session.id}><td className="py-3"><Link className="font-semibold hover:text-emerald-600" href={`/admin/users/${session.userId}`}>{session.name}</Link><span className="mt-1 block text-xs text-muted">{session.email}</span></td><td className="py-3 font-mono text-xs">{session.ipAddress}</td><td className="max-w-[220px] truncate py-3 text-xs text-muted">{session.userAgent}</td><td className="py-3 text-xs text-muted">{new Date(session.updatedAt).toLocaleTimeString("tr-TR")}</td></tr>)}</tbody></table></div>
          {!dashboard.details.activeSessions.length ? <Empty text="Şu an aktif kullanıcı yok." /> : null}
        </Panel>

        <Panel eyebrow="Ziyaret ve oynatma" title="Bugünün platform özeti" icon={Globe2}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Insight label="Keşfet etkileşimi" value={dashboard.summary.discoverEventsToday} detail="Bugün kaydedilen keşfet olayları" />
            <Insight label="Yeni yayın" value={dashboard.summary.releasesToday} detail="Bugün gönderilen yayınlar" />
            <Insight label="Bekleyen yayın" value={dashboard.summary.pendingReleases} detail="İnceleme veya işlem bekleyenler" />
            <Insight label="Bekleyen başvuru" value={dashboard.summary.pendingApplications} detail="Sanatçı/organizasyon incelemeleri" />
          </div>
          <p className="mt-5 rounded-2xl border border-line bg-surface p-4 text-xs leading-5 text-muted">Sayfa bazlı kalış süresi için ziyaretçi olayları anonimleştirilmiş olarak ölçülür; ham IP tutulmaz. Mevcut panelde ölçülebilen Smart Link, keşfet ve oynatma olayları burada gerçek zamanlı özetlenir.</p>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel eyebrow="Bugünkü hareket" title="Son kayıtlar ve yayınlar" icon={Clock3}>
          <div className="space-y-2">{dashboard.details.recentRegistrations.map((user) => <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-3" key={user.id}><div><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-muted">Yeni kullanıcı · {user.email}</p></div><span className="text-xs text-muted">{new Date(user.createdAt).toLocaleTimeString("tr-TR")}</span></div>)}{dashboard.details.recentReleases.map((release) => <Link className="flex items-center justify-between rounded-2xl border border-line bg-surface p-3 transition hover:border-emerald-300" href={`/admin/releases/${release.id}`} key={release.id}><div><p className="text-sm font-semibold">{release.title}</p><p className="text-xs text-muted">Yeni yayın · {release.status}</p></div><ArrowUpRight className="size-4 text-muted" /></Link>)}</div>
          {!dashboard.details.recentRegistrations.length && !dashboard.details.recentReleases.length ? <Empty text="Bugün henüz kayıt yok." /> : null}
        </Panel>

        <Panel eyebrow="Operasyon" title="Dağıtım kuyruğu" icon={Rocket}>
          <div className="space-y-2">{dashboard.details.distributionQueue.map((job) => <Link className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-emerald-300" href={`/admin/distribution/jobs/${job.id}`} key={job.id}><div className="min-w-0"><p className="truncate text-sm font-semibold">{job.releaseTitle}</p><p className="mt-1 text-xs text-muted">{job.provider} · Deneme {job.attemptCount}/{job.maxRetryCount}</p></div><span className="shrink-0 rounded-full border border-line px-2 py-1 text-[10px] font-semibold">{statusLabels[job.status] ?? job.status}</span></Link>)}</div>
          {!dashboard.details.distributionQueue.length ? <Empty text="Dağıtım kuyruğu boş." /> : null}
        </Panel>
      </section>
    </div>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) { return <div className="panel bg-surface p-4"><Icon className="size-5 text-emerald-600" /><p className="mt-4 text-2xl font-semibold">{number(value)}</p><p className="mt-1 text-sm text-muted">{label}</p></div>; }
function Insight({ label, value, detail }: { label: string; value: number; detail: string }) { return <div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{number(value)}</p><p className="mt-1 text-xs text-muted">{detail}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">{text}</p>; }
function Panel({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: typeof Users; children: ReactNode }) { return <section className="panel p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p><h2 className="mt-2 text-xl font-semibold">{title}</h2></div><Icon className="size-5 text-emerald-600" /></div><div className="mt-5">{children}</div></section>; }
