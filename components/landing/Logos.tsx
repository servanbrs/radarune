export default function Logos() {
  const logos = [
    "Spotify",
    "Apple Music",
    "YouTube",
    "TikTok",
    "Instagram",
    "Amazon",
    "Deezer",
    "Tidal",
    "Boomplay",
    "Shazam",
  ];

  return (
    <section className="border-y border-white/5 bg-black py-10 overflow-hidden">
      <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite] gap-20 text-zinc-500 font-semibold text-lg">

        {[...logos, ...logos].map((logo, index) => (
          <span
            key={index}
            className="hover:text-white transition-all duration-300"
          >
            {logo}
          </span>
        ))}

      </div>
    </section>
  );
}