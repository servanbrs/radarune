import type { ReleaseTypeValue } from "@/features/releases/constants/release.constants";

export type ReleaseValidationIssueInput = {
  fieldPath: string;
  step: string;
  code: string;
  message: string;
  severity: "ERROR" | "WARNING" | "INFO";
  trackId?: string;
};

type ValidationRelease = {
  type: ReleaseTypeValue;
  previouslyReleased: boolean;
  upc: string | null;
  artworkUploadId: string | null;
  artworkUploadStatus?: "PENDING" | "READY" | "FAILED";
  stores: Array<{ storeCode: string }>;
  tracks: Array<{
    id: string;
    instrumental: boolean;
    previouslyReleased: boolean;
    isrc: string | null;
    audioUploadId: string | null;
    audioUploadStatus?: "PENDING" | "READY" | "FAILED";
    contributors: Array<{
      role: string;
    }>;
  }>;
};

const isrcPattern = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/;
const upcPattern = /^([0-9]{12}|[0-9]{13})$/;

export class ReleaseValidatorService {
  validateForSubmit(release: ValidationRelease): ReleaseValidationIssueInput[] {
    const issues: ReleaseValidationIssueInput[] = [];
    const trackCount = release.tracks.length;

    if (release.type === "SINGLE" && trackCount !== 1) {
      issues.push({
        fieldPath: "tracks",
        step: "tracks",
        code: "TRACK_COUNT_SINGLE",
        message: "Single yayın tam olarak 1 parça içermelidir.",
        severity: "ERROR",
      });
    }

    if (release.type === "EP" && (trackCount < 2 || trackCount > 6)) {
      issues.push({
        fieldPath: "tracks",
        step: "tracks",
        code: "TRACK_COUNT_EP",
        message: "EP yayın 2 ile 6 parça arasında olmalıdır.",
        severity: "ERROR",
      });
    }

    if (release.type === "ALBUM" && trackCount < 7) {
      issues.push({
        fieldPath: "tracks",
        step: "tracks",
        code: "TRACK_COUNT_ALBUM",
        message: "Albüm en az 7 parça içermelidir.",
        severity: "ERROR",
      });
    }

    if (release.previouslyReleased && !release.upc) {
      issues.push({
        fieldPath: "upc",
        step: "basic",
        code: "UPC_REQUIRED_FOR_REDELIVERY",
        message: "Daha önce dağıtılan yayınlar için UPC zorunludur.",
        severity: "ERROR",
      });
    }

    if (release.upc && !upcPattern.test(release.upc)) {
      issues.push({
        fieldPath: "upc",
        step: "basic",
        code: "UPC_INVALID",
        message: "UPC/EAN 12 veya 13 haneli olmalıdır.",
        severity: "ERROR",
      });
    }

    if (!release.artworkUploadId) {
      issues.push({
        fieldPath: "artwork",
        step: "artwork",
        code: "ARTWORK_REQUIRED",
        message: "Kapak görseli yüklenmelidir.",
        severity: "ERROR",
      });
    }
    if (release.artworkUploadId && release.artworkUploadStatus && release.artworkUploadStatus !== "READY") {
      issues.push({
        fieldPath: "artwork",
        step: "artwork",
        code: "ARTWORK_UPLOAD_NOT_READY",
        message: "Kapak yüklemesi henüz tamamlanmadı veya geçersiz.",
        severity: "ERROR",
      });
    }

    if (release.stores.length === 0) {
      issues.push({
        fieldPath: "stores",
        step: "distribution",
        code: "STORE_REQUIRED",
        message: "En az bir mağaza seçilmelidir.",
        severity: "ERROR",
      });
    }

    release.tracks.forEach((track, index) => {
      const prefix = `tracks.${index}`;
      if (!track.audioUploadId) {
        issues.push({
          fieldPath: `${prefix}.audio`,
          step: "tracks",
          code: "AUDIO_REQUIRED",
          message: `${index + 1}. parça için ses dosyası yüklenmelidir.`,
          severity: "ERROR",
          trackId: track.id,
        });
      }
      if (track.audioUploadId && track.audioUploadStatus && track.audioUploadStatus !== "READY") {
        issues.push({
          fieldPath: `${prefix}.audio`,
          step: "tracks",
          code: "AUDIO_UPLOAD_NOT_READY",
          message: `${index + 1}. parça için ses yüklemesi henüz tamamlanmadı veya geçersiz.`,
          severity: "ERROR",
          trackId: track.id,
        });
      }

      if (track.previouslyReleased && !track.isrc) {
        issues.push({
          fieldPath: `${prefix}.isrc`,
          step: "tracks",
          code: "ISRC_REQUIRED_FOR_REDELIVERY",
          message: `${index + 1}. daha önce dağıtılmış parça için ISRC zorunludur.`,
          severity: "ERROR",
          trackId: track.id,
        });
      }

      if (track.isrc && !isrcPattern.test(track.isrc)) {
        issues.push({
          fieldPath: `${prefix}.isrc`,
          step: "tracks",
          code: "ISRC_INVALID",
          message: `${index + 1}. parçanın ISRC biçimi geçerli değil.`,
          severity: "ERROR",
          trackId: track.id,
        });
      }

      const contributorRoles = new Set(
        track.contributors.map((contributor) => contributor.role),
      );

      if (!contributorRoles.has("COMPOSER")) {
        issues.push({
          fieldPath: `${prefix}.contributors`,
          step: "rights",
          code: "COMPOSER_REQUIRED",
          message: `${index + 1}. parça için en az bir besteci eklenmelidir.`,
          severity: "ERROR",
          trackId: track.id,
        });
      }

      if (!track.instrumental && !contributorRoles.has("LYRICIST")) {
        issues.push({
          fieldPath: `${prefix}.contributors`,
          step: "rights",
          code: "LYRICIST_REQUIRED",
          message: `${index + 1}. sözlü parça için en az bir söz yazarı eklenmelidir.`,
          severity: "ERROR",
          trackId: track.id,
        });
      }
    });

    return issues;
  }
}

export const releaseValidatorService = new ReleaseValidatorService();
