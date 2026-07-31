export function LandingBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-amber-400/15 blur-[140px]" />
      <div className="absolute right-[-14rem] top-[18rem] h-[32rem] w-[32rem] rounded-full bg-orange-500/10 blur-[150px]" />
      <div className="absolute bottom-[8rem] left-[-12rem] h-[28rem] w-[28rem] rounded-full bg-yellow-300/10 blur-[150px]" />

      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 88%)",
        }}
      />

      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/45 to-transparent" />
    </div>
  );
}
