export function createTrackKey(params: {
  isrc?: string | null;
  trackTitle: string;
  releaseTitle: string;
}) {
  if (params.isrc) {
    return params.isrc.trim().toUpperCase();
  }

  return `${params.releaseTitle.trim().toLowerCase()}::${params.trackTitle
    .trim()
    .toLowerCase()}`;
}
