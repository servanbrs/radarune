import { notFound } from "next/navigation";
import { prisma } from "@/server/prisma/prisma";
import { releaseIdTokenFromSlug } from "@/features/releases/lib/release-url";

export default async function PublicReleaseSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = releaseIdTokenFromSlug(slug);
  if (!token) notFound();
  const release = await prisma.release.findFirst({ where: { id: { startsWith: token } }, select: { id: true } });
  if (!release) notFound();
  const { default: ReleaseDetailPage } = await import("@/app/(app)/releases/[id]/page");
  return <ReleaseDetailPage params={Promise.resolve({ id: release.id })} />;
}
