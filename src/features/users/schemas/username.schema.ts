import { z } from "zod";

export const reservedUsernames = new Set([
  "admin", "administrator", "api", "auth", "login", "register", "dashboard", "moderator", "support", "help", "blog", "artist", "artists", "release", "releases", "discover", "charts", "settings", "install", "legal", "radarune", "u",
]);

const turkishUsernameCharacters: Record<string, string> = {
  "ı": "i", "İ": "i", "ğ": "g", "Ğ": "g", "ş": "s", "Ş": "s",
  "ç": "c", "Ç": "c", "ö": "o", "Ö": "o", "ü": "u", "Ü": "u",
};

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİğĞşŞçÇöÖüÜ]/g, (character) => turkishUsernameCharacters[character] ?? character)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
  .max(40, "Kullanıcı adı en fazla 40 karakter olabilir.")
  .transform(normalizeUsername)
  .refine((value) => /^[a-z0-9]+(?:[._][a-z0-9]+)*$/.test(value), "Kullanıcı adı yalnızca harf, rakam, nokta ve alt çizgi içerebilir.")
  .refine((value) => !reservedUsernames.has(value), "Bu kullanıcı adı ayrılmıştır.");

export const updateUsernameSchema = z.object({ username: usernameSchema });
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;
