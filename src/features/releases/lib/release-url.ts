export function releaseSlug(title: string, id: string) {
  const normalized = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const publicToken = id.startsWith("cms") ? id.slice(3, 11) : id.slice(0, 8);
  return `${normalized || "yayin"}-${publicToken}`;
}

export function releasePublicPath(title: string, id: string) {
  return `/release/${releaseSlug(title, id)}`;
}

export function releaseIdTokenFromSlug(slug: string) {
  const token = slug.split("-").at(-1) ?? "";
  return /^[a-z0-9]{8}$/i.test(token) || /^cms[a-z0-9]{5}$/i.test(token) ? token : null;
}
