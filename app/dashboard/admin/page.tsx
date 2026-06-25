import { prisma } from "@/lib/prisma";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminPage() {
  const releases = await prisma.release.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl p-10">

        <h1 className="text-5xl font-black">
          Yayın Yönetimi
        </h1>

        <p className="mt-3 text-zinc-500">
          Gelen yayınları incele ve yönet.
        </p>

        <div className="mt-10">
          <AdminTable releases={releases} />
        </div>

      </div>
    </main>
  );
}