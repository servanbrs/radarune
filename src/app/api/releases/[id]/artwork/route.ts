import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { releaseService } from "@/features/releases/server/services/release.service";
import { storageService } from "@/features/storage/server/services/storage.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { organization, user } = await authSessionService.getDashboardContext();
    const actor = {
      organizationId: organization.organization.id,
      membershipRole: organization.role,
      systemRole: user.systemRole,
      userId: user.id,
    };
    const release = await releaseService.getRelease(actor, id);
    if (!release) return Response.json({ error: "Yayın bulunamadı." }, { status: 404 });

    const upload = release.uploads.find((item) => item.id === release.artworkUploadId && item.kind === "ARTWORK")
      ?? release.uploads.find((item) => item.kind === "ARTWORK" && item.status !== "FAILED");
    if (!upload) return Response.json({ error: "Kapak dosyası bulunamadı." }, { status: 404 });

    const body = await storageService.getAdapter().getObject(upload.storageKey);
    if (!body.byteLength) return Response.json({ error: "Kapak dosyası boş." }, { status: 404 });

    return new Response(Buffer.from(body), {
      headers: {
        "Content-Type": upload.mimeType?.startsWith("image/") ? upload.mimeType : "image/jpeg",
        "Content-Length": String(body.byteLength),
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kapak okunamadı.";
    const status = message.includes("görüntüleme yetkiniz") ? 403 : message.includes("Oturum") ? 401 : 404;
    return Response.json({ error: message }, { status });
  }
}
