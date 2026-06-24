const releases = [
  {
    title: "Palm Fade",
    status: "Live",
  },
  {
    title: "Arabian Nights",
    status: "Pending",
  },
];

export default function Releases() {
  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">

      <h2 className="text-2xl font-bold">
        Son Yayınlar
      </h2>

      <div className="mt-8 space-y-4">

        {releases.map((release) => (

          <div
            key={release.title}
            className="flex items-center justify-between rounded-2xl bg-black/30 p-5"
          >

            <div>

              <h3 className="font-semibold">
                {release.title}
              </h3>

              <p className="text-zinc-500">
                Deep House
              </p>

            </div>

            <span className="rounded-full bg-violet-600 px-4 py-2 text-sm">

              {release.status}

            </span>

          </div>

        ))}

      </div>

    </section>
  );
}