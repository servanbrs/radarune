import { NextResponse } from "next/server";
import { rbacService } from "@/features/authorization/server/rbac";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { privateStorageService } from "@/features/storage/server/services/private-storage.service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { organization, user } = await authSessionService.getDashboardContext();
    const canViewAll = rbacService.hasEffectivePermission({ membershipRole: organization.role, systemRole: user.systemRole, permission: "storage.view" });
    const { id } = await context.params;
    const rangeHeader = request.headers.get("range");
    const result = await privateStorageService.getStream({ organizationId: organization.organization.id, userId: user.id, uploadId: id, ...(rangeHeader ? { rangeHeader } : {}), canViewAll });
    const headers = new Headers({ "Content-Type": result.contentType, "Content-Disposition": `inline; filename="${result.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}"`, "Accept-Ranges": "bytes", "Content-Length": String(result.end - result.start + 1), "Cache-Control": "private, no-store" });
    if (result.partial) headers.set("Content-Range", `bytes ${result.start}-${result.end}/${result.size}`);
    return new Response(result.body, { status: result.partial ? 206 : 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dosya okunamadı.";
    const status = message.includes("Oturum") ? 401 : message.includes("izin") ? 403 : message.includes("bulunamadı") ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
