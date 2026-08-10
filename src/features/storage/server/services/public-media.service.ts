import "server-only";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { storageService } from "@/features/storage/server/services/storage.service";
import { readImageDimensions } from "@/features/releases/server/lib/image-dimensions";

const profileImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const faviconTypes = new Set(["image/png", "image/x-icon", "image/vnd.microsoft.icon"]);

export type PublicMediaKind = "PROFILE" | "COVER" | "LOGO" | "FAVICON";

export class PublicMediaService {
  async upload(input: { file: File; organizationId: string; ownerId: string; kind: PublicMediaKind; entityId?: string }) {
    const maxBytes = input.kind === "FAVICON" ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
    const allowed = input.kind === "FAVICON" ? faviconTypes : profileImageTypes;
    if (!allowed.has(input.file.type)) throw new Error(input.kind === "FAVICON" ? "Favicon PNG veya ICO formatında olmalıdır." : "Görsel JPG, PNG veya WebP formatında olmalıdır.");

    const body = Buffer.from(await input.file.arrayBuffer());
    if (body.byteLength === 0 || body.byteLength > maxBytes) throw new Error(`Görsel en fazla ${Math.round(maxBytes / 1024 / 1024)} MB olabilir.`);

    const dimensions = readImageDimensions(body, input.file.type);
    if (input.kind === "FAVICON" && dimensions && (dimensions.width < 32 || dimensions.height < 32 || dimensions.width > 512 || dimensions.height > 512)) throw new Error("Favicon 32x32 ile 512x512 piksel arasında olmalıdır.");
    if (input.kind === "LOGO" && dimensions && (dimensions.width < 256 || dimensions.height < 256)) throw new Error("Logo en az 256x256 piksel olmalıdır.");

    const extension = input.file.type === "image/png" ? "png" : input.file.type === "image/webp" ? "webp" : "jpg";
    const scope = input.kind === "FAVICON" || input.kind === "LOGO" ? "branding" : "artists";
    const key = `public/${scope}/${input.organizationId}/${input.entityId ?? input.ownerId}/${input.kind.toLowerCase()}-${randomUUID()}.${extension}`;
    await storageService.getAdapter().upload({ key, contentType: input.file.type, body });
    return { key, url: this.urlFor(key) };
  }

  urlFor(key: string) {
    const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    return `${base}/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}

export const publicMediaService = new PublicMediaService();
