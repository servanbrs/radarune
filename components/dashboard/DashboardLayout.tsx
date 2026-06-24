import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">

      <Sidebar />

      <main className="ml-72">

        <Topbar />

        <div className="p-8">
          {children}
        </div>

      </main>

    </div>
  );
}