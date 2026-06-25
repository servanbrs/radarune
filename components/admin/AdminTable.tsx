"use client";

import { useRouter } from "next/navigation";

export default function AdminTable({
  releases,
}: {
  releases: any[];
}) {
  const router = useRouter();

  async function updateStatus(
    id: number,
    status: string
  ) {
    console.log("Tıklandı", id, status);

    try {
      const res = await fetch(`/api/releases/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      console.log("Status:", res.status);

      const data = await res.json();
      console.log(data);

      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      {releases.map((release) => (
        <div
          key={release.id}
          className="rounded-3xl border border-white/10 p-6"
        >
          <h2 className="text-2xl font-bold">
            {release.trackTitle}
          </h2>

          <p className="mt-2 text-zinc-400">
            {release.artistName}
          </p>

          <div className="mt-4 flex gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
              {release.genre}
            </span>

            <span className="rounded-full bg-violet-500/20 px-4 py-2 text-sm">
              {release.status}
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() =>
                updateStatus(release.id, "approved")
              }
              className="rounded-xl bg-green-600 px-5 py-3"
            >
              Onayla
            </button>

            <button
              onClick={() =>
                updateStatus(release.id, "rejected")
              }
              className="rounded-xl bg-red-600 px-5 py-3"
            >
              Reddet
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}