const DEFAULT_REDIRECT = "/dashboard";

/** Only allow local application paths; never redirect to an external origin. */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }

  try {
    const parsed = new URL(value, "https://radarune.invalid");
    if (parsed.origin !== "https://radarune.invalid") return DEFAULT_REDIRECT;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

