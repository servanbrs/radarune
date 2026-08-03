import { NextResponse } from "next/server";

export function sitemapXmlResponse(xml: string) {
  return new NextResponse(xml, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
