import { z } from "zod";

const socialHosts: Record<string, readonly string[]> = {
  spotifyProfileUrl: ["open.spotify.com"],
  appleMusicProfileUrl: ["music.apple.com"],
  youtubeProfileUrl: ["youtube.com", "www.youtube.com", "youtu.be"],
  tiktokProfileUrl: ["tiktok.com", "www.tiktok.com"],
  instagramProfileUrl: ["instagram.com", "www.instagram.com"],
  xProfileUrl: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  facebookProfileUrl: ["facebook.com", "www.facebook.com"],
  soundcloudProfileUrl: ["soundcloud.com", "www.soundcloud.com"],
  deezerProfileUrl: ["deezer.com", "www.deezer.com"],
};

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const nullableUrl = z.url().nullable().optional();

export const artistProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(3).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  profileImageUrl: nullableUrl,
  coverImageUrl: nullableUrl,
  shortBiography: nullableText(500),
  biography: nullableText(10_000),
  country: nullableText(100),
  city: nullableText(100),
  genre: nullableText(100),
  subgenre: nullableText(100),
  language: nullableText(50),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).nullable().optional(),
  spotifyProfileUrl: nullableUrl,
  appleMusicProfileUrl: nullableUrl,
  youtubeProfileUrl: nullableUrl,
  tiktokProfileUrl: nullableUrl,
  instagramProfileUrl: nullableUrl,
  xProfileUrl: nullableUrl,
  facebookProfileUrl: nullableUrl,
  soundcloudProfileUrl: nullableUrl,
  deezerProfileUrl: nullableUrl,
  websiteUrl: nullableUrl,
  bookingEmail: z.email().nullable().optional(),
  managementEmail: z.email().nullable().optional(),
  seoTitle: nullableText(160),
  seoDescription: nullableText(320),
  ogImageUrl: nullableUrl,
}).superRefine((value, context) => {
  for (const [field, hosts] of Object.entries(socialHosts)) {
    const url = value[field as keyof typeof value];
    if (typeof url !== "string") continue;
    const hostname = new URL(url).hostname.toLowerCase();
    if (!hosts.includes(hostname)) {
      context.addIssue({ code: "custom", path: [field], message: "Bu alan için izin verilen sosyal ağ URL'sini kullanın." });
    }
  }
});

export type ArtistProfileUpdateInput = z.infer<typeof artistProfileUpdateSchema>;
