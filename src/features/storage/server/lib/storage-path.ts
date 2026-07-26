import path from "node:path";

export function assertSafeStorageKey(key: string) {
  if (!key || key.includes("\\") || path.posix.isAbsolute(key)) {
    throw new Error("Storage anahtarı geçersiz.");
  }
  const normalized = path.posix.normalize(key);
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error("Storage anahtarında path traversal tespit edildi.");
  }
  return normalized;
}

export function resolveStoragePath(root: string, key: string) {
  const safeKey = assertSafeStorageKey(key);
  const rootPath = path.resolve(root);
  const absolutePath = path.resolve(rootPath, safeKey);
  if (absolutePath !== rootPath && !absolutePath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error("Storage yolu izin verilen dizinin dışına çıkıyor.");
  }
  return absolutePath;
}
