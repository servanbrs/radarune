import { notFound } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { SmartLinkForm } from "@/features/growth/components/smart-link-form";
import { smartLinkService } from "@/features/growth/server/services/smart-link.service";

export default async function AdminEditSmartLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const [link, artists] = await Promise.all([smartLinkService.getById(actor, id), artistService.listByOrganizationId(organization.organization.id)]);
  if (!link) notFound();
  return <AdminShell title="Smart Link düzenle" description="Bağlantıları, SEO alanlarını ve yayın durumunu yönetin."><SmartLinkForm artists={artists.map((artist) => ({ id: artist.id, name: artist.name }))} redirectTo="/admin/smart-links" initial={{ id: link.id, artistId: link.artistId, title: link.title, slug: link.slug, description: link.description, seoTitle: link.seoTitle, seoDescription: link.seoDescription, coverImageUrl: link.coverImageUrl, active: link.active, platforms: link.platforms.map((platform) => ({ platform: platform.platform, url: platform.url, buttonText: platform.buttonText })) }} /></AdminShell>;
}
