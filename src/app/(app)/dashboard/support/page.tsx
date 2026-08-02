import { SupportInbox } from "@/features/support/components/support-inbox";

export default function DashboardSupportPage() {
  return <main className="page-shell"><div className="w-full"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Yardım merkezi</p><h1 className="mt-2 text-3xl font-semibold">Destek</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">ISRC, UPC veya yayın bilgilerinizi ekleyerek Radarune ekibine ulaşın.</p><div className="mt-6"><SupportInbox /></div></div></main>;
}

