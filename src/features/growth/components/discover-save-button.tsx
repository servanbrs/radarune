"use client";
import Link from "next/link";
import { Bookmark } from "lucide-react";
export function DiscoverSaveButton({ trackId }: { trackId: string }) { return <Link aria-label="Playlist'e kaydet" className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-background text-foreground" href={`/playlists/new?trackId=${encodeURIComponent(trackId)}`}><Bookmark className="size-4" /></Link>; }
