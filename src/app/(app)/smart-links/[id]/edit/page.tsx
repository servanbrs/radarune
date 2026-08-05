import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { SmartLinkForm } from "@/features/growth/components/smart-link-form";
import { smartLinkService } from "@/features/growth/server/services/smart-link.service";

export default async function EditSmartLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const [link, artists] = await Promise.all([smartLinkService.getById(actor, id), artistService.listByOrganizationId(organization.organization.id)]);
  if (!link) notFound();
  return <main className="page-shell"><section className="panel p-6 md:p-8"><p className="text-xs uppercase tracking-[0.24em] text-muted">Smart Link</p><h1 className="mt-3 text-3xl font-semibold">{link.title} düzenle</h1><p className="mt-2 text-sm text-muted">Profil fotoğrafı, kapak, bağlantılar, SEO ve yayın durumunu tek panelden güncelleyin.</p></section><SmartLinkForm artists={artists.map((artist) => ({ id: artist.id, name: artist.name, profileImageUrl: artist.profileImageUrl }))} initial={{ id: link.id, artistId: link.artistId, title: link.title, slug: link.slug, description: link.description, seoTitle: link.seoTitle, seoDescription: link.seoDescription, coverImageUrl: link.coverImageUrl, active: link.active, platforms: link.platforms.map((platform) => ({ platform: platform.platform, url: platform.url, buttonText: platform.buttonText })) }} /></main>;
}
