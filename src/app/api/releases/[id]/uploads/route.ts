import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";
import { releaseService } from "@/features/releases/server/services/release.service";
import { uploadService } from "@/features/releases/server/services/upload.service";

type UploadRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: UploadRouteContext) {
  return withReleaseActor(async (actor) => {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");
    const trackId = formData.get("trackId");

    if (!(file instanceof File)) {
      return releaseJson(
        {
          success: false,
          message: "Yüklenecek dosya bulunamadı.",
        },
        422,
      );
    }

    if (kind !== "AUDIO" && kind !== "ARTWORK" && kind !== "VIDEO") {
      return releaseJson(
        {
          success: false,
          message: "Yükleme türü geçerli değil.",
        },
        422,
      );
    }

    const upload = await uploadService.storeUpload({
      organizationId: actor.organizationId,
      ownerUserId: actor.userId,
      file,
      kind,
    });

    const result = await releaseService.attachUpload(actor, id, {
      uploadId: upload.id,
      kind,
      ...(typeof trackId === "string" && trackId.length > 0 ? { trackId } : {}),
    });

    return releaseJson(
      {
        ...result,
        upload,
      },
      result.success ? 201 : 422,
    );
  });
}
