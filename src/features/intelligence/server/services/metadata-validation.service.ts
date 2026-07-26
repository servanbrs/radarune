import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { stableHash } from "@/features/intelligence/lib/hash";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";

type ReleaseForValidation = NonNullable<Awaited<ReturnType<typeof intelligenceRepository.findReleaseDetail>>>;

export type IntelligenceValidationIssue = {
  fieldPath: string;
  step: string;
  code: string;
  category: "METADATA" | "AUDIO" | "ARTWORK" | "RIGHTS" | "PROVIDER_COMPATIBILITY" | "CONTRIBUTOR" | "DUPLICATE" | "LYRICS";
  title: string;
  message: string;
  suggestedAction?: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  blocking: boolean;
  source: "RULE_ENGINE" | "AI" | "AUDIO_ANALYZER" | "ARTWORK_ANALYZER" | "PROVIDER_RULE";
  trackId?: string;
  metadata?: Prisma.InputJsonValue;
};

const isrcPattern = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/;
const urlPattern = /https?:\/\/|www\./i;
const platformNamePattern = /\b(spotify|apple music|youtube|tiktok|instagram|deezer|tidal)\b/i;

function upcChecksumValid(value: string) {
  if (!/^\d{12,13}$/.test(value)) {
    return false;
  }

  const digits = value.split("").map(Number);
  const checkDigit = digits.pop();
  if (checkDigit === undefined) {
    return false;
  }

  const reversed = digits.reverse();
  const sum = reversed.reduce((total, digit, index) => {
    const weight = index % 2 === 0 ? 3 : 1;
    return total + digit * weight;
  }, 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
}

function addIssue(issues: IntelligenceValidationIssue[], issue: IntelligenceValidationIssue) {
  issues.push(issue);
}

export class MetadataValidationService {
  buildInputHash(release: ReleaseForValidation) {
    return stableHash({
      title: release.title,
      versionTitle: release.versionTitle,
      type: release.type,
      primaryLanguage: release.primaryLanguage,
      primaryGenre: release.primaryGenre,
      secondaryGenre: release.secondaryGenre,
      copyrightP: release.copyrightP,
      copyrightC: release.copyrightC,
      plannedReleaseDate: release.plannedReleaseDate?.toISOString(),
      originalReleaseDate: release.originalReleaseDate?.toISOString(),
      previouslyReleased: release.previouslyReleased,
      upc: release.upc,
      tracks: release.tracks.map((track) => ({
        title: track.title,
        trackNumber: track.trackNumber,
        discNumber: track.discNumber,
        isrc: track.isrc,
        previouslyReleased: track.previouslyReleased,
        audioUploadId: track.audioUploadId,
        instrumental: track.instrumental,
        lyrics: track.lyrics,
        artists: track.artists.map((artist) => artist.artistId),
      })),
      stores: release.stores.map((store) => store.storeCode),
    });
  }

  validateRelease(release: ReleaseForValidation): IntelligenceValidationIssue[] {
    const issues: IntelligenceValidationIssue[] = [];
    const title = release.title.trim();

    if (!title) {
      addIssue(issues, this.issue("TITLE_REQUIRED", "title", "basic", "Yayın adı zorunlu", "Yayın adı boş bırakılamaz.", "ERROR", true));
    }

    if (title.length > 160) {
      addIssue(issues, this.issue("TITLE_TOO_LONG", "title", "basic", "Yayın adı çok uzun", "Yayın adı 160 karakteri aşmamalıdır.", "ERROR", true));
    }

    if (title.length > 4 && title === title.toLocaleUpperCase("tr-TR")) {
      addIssue(issues, this.issue("TITLE_ALL_CAPS", "title", "basic", "Yayın adı tamamen büyük harf", "Mağaza uyumluluğu için başlık biçimini gözden geçirin.", "WARNING", false));
    }

    if (platformNamePattern.test(title)) {
      addIssue(issues, this.issue("TITLE_CONTAINS_PLATFORM", "title", "basic", "Başlıkta platform adı var", "Başlık mağaza veya platform adı içermemelidir.", "ERROR", true));
    }

    if (urlPattern.test(title) || emailPattern.test(title) || phonePattern.test(title)) {
      addIssue(issues, this.issue("TITLE_CONTAINS_CONTACT", "title", "basic", "Başlıkta iletişim bilgisi var", "URL, e-posta veya telefon başlıkta kullanılamaz.", "ERROR", true));
    }

    if (release.versionTitle && title.toLowerCase().includes(release.versionTitle.toLowerCase())) {
      addIssue(issues, this.issue("VERSION_DUPLICATED_IN_TITLE", "versionTitle", "basic", "Version bilgisi tekrarlı", "Version bilgisini başlık yerine sürüm alanında tutun.", "WARNING", false));
    }

    this.validateTrackCount(release, issues);

    if (!release.primaryLanguage) {
      addIssue(issues, this.issue("LANGUAGE_REQUIRED", "primaryLanguage", "basic", "Dil seçilmedi", "Birincil dil seçilmelidir.", "ERROR", true));
    }

    if (!release.primaryGenre) {
      addIssue(issues, this.issue("GENRE_REQUIRED", "primaryGenre", "basic", "Tür seçilmedi", "Ana tür seçilmelidir.", "ERROR", true));
    }

    if (!release.copyrightC || !release.copyrightP) {
      addIssue(issues, this.issue("COPYRIGHT_REQUIRED", "copyright", "basic", "Copyright alanları eksik", "℗ ve © copyright alanları doldurulmalıdır.", "ERROR", true));
    }

    if (release.plannedReleaseDate && release.plannedReleaseDate < new Date(new Date().toDateString())) {
      addIssue(issues, this.issue("RELEASE_DATE_IN_PAST", "plannedReleaseDate", "distribution", "Yayın tarihi geçmişte", "Planlanan yayın tarihi bugünden önce olamaz.", "ERROR", true));
    }

    if (release.originalReleaseDate && release.plannedReleaseDate && release.originalReleaseDate > release.plannedReleaseDate) {
      addIssue(issues, this.issue("ORIGINAL_DATE_AFTER_RELEASE", "originalReleaseDate", "basic", "Orijinal tarih tutarsız", "Orijinal yayın tarihi planlanan tarihten sonra olamaz.", "ERROR", true));
    }

    if (release.previouslyReleased && !release.upc) {
      addIssue(issues, this.issue("UPC_REQUIRED_FOR_REDELIVERY", "upc", "basic", "UPC zorunlu", "Daha önce dağıtılmış yayınlarda mevcut UPC zorunludur.", "ERROR", true));
    }

    if (release.upc && !upcChecksumValid(release.upc)) {
      addIssue(issues, this.issue("UPC_CHECKSUM_INVALID", "upc", "basic", "UPC/EAN checksum geçersiz", "UPC/EAN değerini kontrol edin.", "ERROR", true));
    }

    if (!release.artworkUploadId) {
      addIssue(issues, this.issue("ARTWORK_REQUIRED", "artwork", "artwork", "Kapak eksik", "Yayın için kapak görseli yüklenmelidir.", "ERROR", true, "ARTWORK"));
    }

    if (release.stores.length === 0) {
      addIssue(issues, this.issue("STORE_REQUIRED", "stores", "distribution", "Mağaza seçilmedi", "En az bir mağaza seçilmelidir.", "ERROR", true, "PROVIDER_COMPATIBILITY"));
    }

    this.validateTracks(release, issues);
    return issues;
  }

  private validateTrackCount(release: ReleaseForValidation, issues: IntelligenceValidationIssue[]) {
    const count = release.tracks.length;
    if (release.type === "SINGLE" && count !== 1) {
      addIssue(issues, this.issue("TRACK_COUNT_SINGLE", "tracks", "tracks", "Single track sayısı hatalı", "Single tam olarak 1 parça içermelidir.", "ERROR", true));
    }
    if (release.type === "EP" && (count < 2 || count > 6)) {
      addIssue(issues, this.issue("TRACK_COUNT_EP", "tracks", "tracks", "EP track sayısı hatalı", "EP 2 ile 6 parça arasında olmalıdır.", "ERROR", true));
    }
    if (release.type === "ALBUM" && count < 7) {
      addIssue(issues, this.issue("TRACK_COUNT_ALBUM", "tracks", "tracks", "Albüm track sayısı hatalı", "Albüm en az 7 parça içermelidir.", "ERROR", true));
    }
  }

  private validateTracks(release: ReleaseForValidation, issues: IntelligenceValidationIssue[]) {
    const titleCounts = new Map<string, number>();
    const isrcCounts = new Map<string, number>();
    for (const track of release.tracks) {
      titleCounts.set(track.title.trim().toLowerCase(), (titleCounts.get(track.title.trim().toLowerCase()) ?? 0) + 1);
      if (track.isrc) {
        isrcCounts.set(track.isrc, (isrcCounts.get(track.isrc) ?? 0) + 1);
      }
    }

    release.tracks.forEach((track, index) => {
      const prefix = `tracks.${index}`;
      if (!track.title.trim()) {
        addIssue(issues, { ...this.issue("TRACK_TITLE_REQUIRED", `${prefix}.title`, "tracks", "Parça adı zorunlu", "Parça adı boş bırakılamaz.", "ERROR", true), trackId: track.id });
      }
      if (track.trackNumber < 1 || track.discNumber < 1) {
        addIssue(issues, { ...this.issue("TRACK_NUMBER_INVALID", `${prefix}.trackNumber`, "tracks", "Parça sırası geçersiz", "Track number ve disc number pozitif olmalıdır.", "ERROR", true), trackId: track.id });
      }
      if ((titleCounts.get(track.title.trim().toLowerCase()) ?? 0) > 1) {
        addIssue(issues, { ...this.issue("DUPLICATE_TRACK_TITLE", `${prefix}.title`, "tracks", "Duplicate parça adı", "Aynı release içinde aynı parça adı birden fazla kullanılmış.", "WARNING", false), trackId: track.id });
      }
      if (track.previouslyReleased && !track.isrc) {
        addIssue(issues, { ...this.issue("ISRC_REQUIRED_FOR_REDELIVERY", `${prefix}.isrc`, "tracks", "ISRC zorunlu", "Daha önce dağıtılmış parçalar için mevcut ISRC zorunludur.", "ERROR", true), trackId: track.id });
      }
      if (track.isrc && !isrcPattern.test(track.isrc)) {
        addIssue(issues, { ...this.issue("ISRC_INVALID", `${prefix}.isrc`, "tracks", "ISRC formatı geçersiz", "ISRC kodu ISO biçimine uygun olmalıdır.", "ERROR", true), trackId: track.id });
      }
      if (track.isrc && (isrcCounts.get(track.isrc) ?? 0) > 1) {
        addIssue(issues, { ...this.issue("ISRC_DUPLICATED", `${prefix}.isrc`, "tracks", "ISRC tekrarlanmış", "Aynı ISRC birden fazla track üzerinde kullanılamaz.", "ERROR", true), trackId: track.id });
      }
      if (track.instrumental && track.lyrics?.trim()) {
        addIssue(issues, { ...this.issue("INSTRUMENTAL_HAS_LYRICS", `${prefix}.lyrics`, "tracks", "Instrumental parçada söz var", "Instrumental işaretli parçada lyrics alanı boş olmalıdır.", "WARNING", false, "LYRICS"), trackId: track.id });
      }
      if (!track.audioUploadId) {
        addIssue(issues, { ...this.issue("AUDIO_REQUIRED", `${prefix}.audio`, "tracks", "Ses dosyası eksik", "Her parça için ses dosyası yüklenmelidir.", "ERROR", true, "AUDIO"), trackId: track.id });
      }
      if (!track.artists.some((artist) => artist.role === "PRIMARY_ARTIST")) {
        addIssue(issues, { ...this.issue("PRIMARY_ARTIST_REQUIRED", `${prefix}.artists`, "tracks", "Primary artist eksik", "Her parçada primary artist olmalıdır.", "ERROR", true, "CONTRIBUTOR"), trackId: track.id });
      }
    });
  }

  private issue(
    code: string,
    fieldPath: string,
    step: string,
    title: string,
    message: string,
    severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL",
    blocking: boolean,
    category: IntelligenceValidationIssue["category"] = "METADATA",
  ): IntelligenceValidationIssue {
    return {
      code,
      fieldPath,
      step,
      category,
      title,
      message,
      severity,
      blocking,
      source: "RULE_ENGINE",
    };
  }
}

export const metadataValidationService = new MetadataValidationService();
