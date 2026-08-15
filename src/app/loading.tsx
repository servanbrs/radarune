export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f9f7] px-6 text-[#10201b]">
      <div className="w-full max-w-3xl animate-pulse space-y-5">
        <div className="h-8 w-36 rounded-full bg-[#dfeae5]" />
        <div className="h-56 rounded-[2rem] bg-[#e7efeb]" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 rounded-3xl bg-[#e7efeb]" />
          <div className="h-28 rounded-3xl bg-[#e7efeb]" />
          <div className="h-28 rounded-3xl bg-[#e7efeb]" />
        </div>
      </div>
    </main>
  );
}
