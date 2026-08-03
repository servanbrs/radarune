import { NextResponse } from "next/server";
import { renderSitemapIndex, sitemapKinds } from "@/features/seo/server/sitemap.service";

export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(renderSitemapIndex([...sitemapKinds]), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
