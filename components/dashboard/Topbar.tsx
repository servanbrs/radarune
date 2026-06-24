import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex h-24 items-center justify-between border-b border-white/10 px-10">

      <div>

        <h2 className="text-3xl font-bold">
          Dashboard
        </h2>

        <p className="text-zinc-500">
          Hoş geldin 👋
        </p>

      </div>

      <div className="flex items-center gap-5">

        <button className="rounded-xl bg-white/5 p-3">
          <Bell />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 font-bold">
          R
        </div>

      </div>

    </header>
  );
}