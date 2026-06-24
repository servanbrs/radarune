import {
  LayoutDashboard,
  Music4,
  PlusCircle,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";

const items = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
  },
  {
    icon: Music4,
    title: "Yayınlar",
  },
  {
    icon: PlusCircle,
    title: "Yeni Yayın",
  },
  {
    icon: Sparkles,
    title: "AI Review",
  },
  {
    icon: Users,
    title: "Profil",
  },
  {
    icon: Settings,
    title: "Ayarlar",
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 border-r border-white/10 bg-[#070707] p-8">

      <h1 className="text-3xl font-black">
        Radarune
      </h1>

      <div className="mt-14 space-y-2">

        {items.map((item) => {

          const Icon = item.icon;

          return (

            <button
              key={item.title}
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-zinc-400 transition hover:bg-violet-600 hover:text-white"
            >
              <Icon size={20} />

              {item.title}

            </button>

          );

        })}

      </div>

    </aside>
  );
}