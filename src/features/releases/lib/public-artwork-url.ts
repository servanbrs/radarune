/**
 * Build the runtime artwork URL used by public pages.
 *
 * Artwork is stored outside the Next.js build output, so the version query
 * is important: it prevents a CDN/browser from keeping an earlier 404 after
 * an artwork upload or replacement.
 */
export function publicReleaseArtworkUrl(
  releaseId: string,
  version?: Date | number | string | null,
) {
  const versionValue =
    version instanceof Date
      ? version.getTime()
      : typeof version === "number" || typeof version === "string"
        ? version
        : "1";

  return `/api/public/v1/releases/${encodeURIComponent(releaseId)}/artwork?v=${encodeURIComponent(String(versionValue))}`;
}
