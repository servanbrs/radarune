"use client";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { AdminV2Analytics } from "@/features/admin/server/services/admin-v2-analytics.service";

const countryNames: Record<string, string> = {
  TR: "Türkiye", DE: "Almanya", FR: "Fransa", GB: "Birleşik Krallık",
  US: "ABD", CA: "Kanada", BR: "Brezilya", MX: "Meksika", ES: "İspanya",
  IT: "İtalya", NL: "Hollanda", BE: "Belçika", SE: "İsveç", NO: "Norveç",
  PL: "Polonya", RU: "Rusya", IN: "Hindistan", JP: "Japonya", KR: "Güney Kore",
  AU: "Avustralya", ZA: "Güney Afrika", AE: "BAE",
};

const isoNumeric: Record<string, string> = {
  "792": "TR", "276": "DE", "250": "FR", "826": "GB", "840": "US",
  "124": "CA", "076": "BR", "484": "MX", "724": "ES", "380": "IT",
  "528": "NL", "056": "BE", "752": "SE", "578": "NO", "616": "PL",
  "643": "RU", "356": "IN", "392": "JP", "410": "KR", "036": "AU",
  "710": "ZA", "784": "AE",
};

type Props = {
  countries: AdminV2Analytics["charts"]["countries"];
};

export function AdminWorldMap({ countries }: Props) {
  const projection = geoNaturalEarth1().fitSize([1000, 500], {
    type: "Sphere",
  } as never);
  const path = geoPath(projection);
  const geography = feature(world as never, world.objects.countries as never) as unknown as {
    features: Array<Feature<Geometry, GeoJsonProperties>>;
  };
  const data = new Map(countries.map((country) => [country.code, country]));
  const maxActivity = Math.max(
    1,
    ...countries.map((country) => country.streams + country.liveVisitors),
  );

  return (
    <div className="relative mt-6 overflow-hidden rounded-[22px] border border-white/10 bg-[#101b19]">
      <svg aria-label="Gerçek dünya ülke aktivite haritası" className="block h-auto w-full" viewBox="0 0 1000 500" role="img">
        <path d={path({ type: "Sphere" }) ?? undefined} fill="#132320" stroke="#39504b" strokeWidth="2" />
        {geography.features.map((country) => {
          const code = isoNumeric[String(country.id ?? "")];
          const activity = code ? data.get(code) : undefined;
          const intensity = activity
            ? 0.35 + Math.min(0.65, (activity.streams + activity.liveVisitors) / maxActivity)
            : 0;
          return (
            <path
              key={String(country.id)}
              d={path(country) ?? undefined}
              fill={activity ? `rgba(52, 211, 153, ${intensity})` : "#263633"}
              stroke="#405650"
              strokeWidth="0.7"
              className="transition-colors hover:fill-emerald-300"
            >
              <title>
                {code ? countryNames[code] ?? code : "Ülke"}
                {activity ? ` · ${activity.streams.toLocaleString("tr-TR")} stream · ${activity.liveVisitors} canlı ziyaretçi` : ""}
              </title>
            </path>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-[#0d1c1a]/85 px-3 py-1.5 text-[11px] text-white/55 backdrop-blur">
        Daha koyu renk = daha yüksek aktivite
      </div>
    </div>
  );
}
