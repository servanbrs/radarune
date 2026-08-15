import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { prisma } from "@/server/prisma/prisma";
import { createAdminArtistAction } from "@/features/admin/server/actions/admin-artist.actions";

export default async function AdminNewArtistPage() {
  const { organization } = await authSessionService.getDashboardContext();
  const users = await prisma.user.findMany({
    where: { accountStatus: "ACTIVE", memberships: { some: { organizationId: organization.organization.id } } },
    select: { id: true, name: true, email: true, emailVerified: true }, orderBy: { name: "asc" }, take: 200,
  });
  async function handleCreate(formData: FormData) {
    "use server";
    await createAdminArtistAction(formData);
  }
  return (
    <AdminShell title="Sanatçı ekle" description="Yeni sanatçı profili oluşturun ve bir Radarune kullanıcısıyla eşleştirin.">
      <form action={handleCreate} className="panel grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <label className="text-sm font-medium">Sanatçı adı<input className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface-strong px-4" name="name" required /></label>
        <label className="text-sm font-medium">Slug<input className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface-strong px-4" name="slug" placeholder="sanatci-adi" required /></label>
        <label className="text-sm font-medium">Sıralama adı<input className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface-strong px-4" name="sortName" /></label>
        <label className="text-sm font-medium">Sanatçı tipi<select className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface-strong px-4" defaultValue="SOLO" name="type"><option value="SOLO">Solo</option><option value="BAND">Grup</option><option value="DUO">Duo</option><option value="ORCHESTRA">Orkestra</option></select></label>
        <label className="text-sm font-medium sm:col-span-2">Bağlı kullanıcı<select className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface-strong px-4" name="ownerUserId"><option value="">Kullanıcı seçilmedi</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}{user.emailVerified ? " · Doğrulandı" : ""}</option>)}</select><span className="mt-1 block text-xs text-muted">Bu kullanıcı sanatçı profilinin sahibi olarak atanır.</span></label>
        <label className="text-sm font-medium">Spotify profili<input className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface-strong px-4" name="spotifyProfileUrl" type="url" /></label>
        <label className="text-sm font-medium">Apple Music profili<input className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface-strong px-4" name="appleMusicProfileUrl" type="url" /></label>
        <div className="flex gap-2 sm:col-span-2"><button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground" type="submit">Sanatçıyı oluştur</button><Link className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold" href="/admin/artists">Vazgeç</Link></div>
      </form>
    </AdminShell>
  );
}
