const stats = [
  {
    title: "Toplam Yayın",
    value: "28",
    color: "text-white",
  },
  {
    title: "Bekleyen",
    value: "4",
    color: "text-yellow-400",
  },
  {
    title: "Yayında",
    value: "24",
    color: "text-green-400",
  },
  {
    title: "Toplam Dinlenme",
    value: "2.1M",
    color: "text-violet-400",
  },
];

export default function Stats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      {stats.map((item)=>(

        <div
          key={item.title}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-7"
        >

          <p className="text-zinc-500">
            {item.title}
          </p>

          <h2 className={`mt-3 text-5xl font-black ${item.color}`}>
            {item.value}
          </h2>

        </div>

      ))}

    </div>
  );
}