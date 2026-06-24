export default function DashboardPreview() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_80px_rgba(139,92,246,.15)]">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Radarune Dashboard</h3>
          <p className="text-sm text-zinc-500">
            Distribution Panel
          </p>
        </div>

        <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
          Online
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">

        <div className="rounded-2xl bg-zinc-900 p-5">
          <p className="text-zinc-500 text-sm">Toplam Yayın</p>
          <h2 className="mt-2 text-3xl font-bold">128</h2>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-5">
          <p className="text-zinc-500 text-sm">Bekleyen</p>
          <h2 className="mt-2 text-3xl font-bold text-yellow-400">
            3
          </h2>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-5">
          <p className="text-zinc-500 text-sm">Yayında</p>
          <h2 className="mt-2 text-3xl font-bold text-emerald-400">
            125
          </h2>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-5">
          <p className="text-zinc-500 text-sm">Platform</p>
          <h2 className="mt-2 text-3xl font-bold">
            50+
          </h2>
        </div>

      </div>

      <div className="mt-8 space-y-4">

        <div className="flex items-center justify-between rounded-2xl bg-zinc-900 p-4">

          <div>
            <h4 className="font-semibold">Palm Fade</h4>
            <p className="text-sm text-zinc-500">
              Deep House
            </p>
          </div>

          <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
            Live
          </div>

        </div>

        <div className="flex items-center justify-between rounded-2xl bg-zinc-900 p-4">

          <div>
            <h4 className="font-semibold">
              Arabian Nights
            </h4>
            <p className="text-sm text-zinc-500">
              Waiting Review
            </p>
          </div>

          <div className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-400">
            Pending
          </div>

        </div>

      </div>

    </div>
  );
}