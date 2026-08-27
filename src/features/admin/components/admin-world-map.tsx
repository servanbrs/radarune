"use client";

import { useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { AdminV2Analytics } from "@/features/admin/server/services/admin-v2-analytics.service";
import { Minus, Plus, RotateCcw } from "lucide-react";

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
  activeSessions: Array<{
    id: string;
    userId: string | null;
    name: string;
    email: string;
    country: string;
    countryCode: string | null;
    city: string;
  }>;
};

export function AdminWorldMap({ countries, activeSessions }: Props) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const projection = geoNaturalEarth1()
    .scale(185)
    .translate([500, 250]);
  const path = geoPath(projection);
  const geography = feature(world as never, world.objects.countries as never) as unknown as {
    features: Array<Feature<Geometry, GeoJsonProperties>>;
  };
  const data = useMemo(() => new Map(countries.map((country) => [country.code, country])), [countries]);
  const activeUsersByCountry = useMemo(() => {
    const grouped = new Map<string, typeof activeSessions>();
    for (const session of activeSessions) {
      if (!session.countryCode) continue;
      const users = grouped.get(session.countryCode) ?? [];
      users.push(session);
      grouped.set(session.countryCode, users);
    }
    return grouped;
  }, [activeSessions]);
  const maxActivity = Math.max(
    1,
    ...countries.map((country) => country.streams + country.liveVisitors),
  );
  const hoveredUsers = hoveredCode ? activeUsersByCountry.get(hoveredCode) ?? [] : [];
  const hoveredActivity = hoveredCode ? data.get(hoveredCode) : undefined;

  function resetView() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function changeZoom(delta: number) {
    setZoom((value) => Math.min(3.5, Math.max(1, Number((value + delta).toFixed(2)))));
  }

  return (
    <div className="relative mt-6 overflow-hidden rounded-[22px] border border-white/10 bg-[#101827]">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-[#121a2b]/90 p-1 shadow-lg backdrop-blur">
        <button aria-label="Haritayı uzaklaştır" className="flex size-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30" disabled={zoom <= 1} onClick={() => changeZoom(-0.25)} type="button"><Minus className="size-4" /></button>
        <button aria-label="Haritayı sıfırla" className="flex size-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white" onClick={resetView} type="button"><RotateCcw className="size-3.5" /></button>
        <button aria-label="Haritayı yakınlaştır" className="flex size-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30" disabled={zoom >= 3.5} onClick={() => changeZoom(0.25)} type="button"><Plus className="size-4" /></button>
      </div>

      <svg
        aria-label="Gerçek dünya ülke aktivite haritası"
        className="block h-[300px] w-full touch-none cursor-grab select-none sm:h-[390px] active:cursor-grabbing"
        onPointerCancel={() => { dragRef.current = null; }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          setOffset({
            x: dragRef.current.offsetX + (event.clientX - dragRef.current.x) * 1.5,
            y: dragRef.current.offsetY + (event.clientY - dragRef.current.y) * 1.5,
          });
        }}
        onPointerUp={() => { dragRef.current = null; }}
        onWheel={(event) => {
          event.preventDefault();
          changeZoom(event.deltaY < 0 ? 0.15 : -0.15);
        }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox="0 0 1000 500"
      >
        <g transform={`translate(500 250) translate(${offset.x} ${offset.y}) scale(${zoom}) translate(-500 -250)`}>
          <path d={path({ type: "Sphere" }) ?? undefined} fill="#132320" stroke="#39504b" strokeWidth="2" />
          {geography.features.map((country, index) => {
            const code = isoNumeric[String(country.id ?? "")];
            const activity = code ? data.get(code) : undefined;
            const countryLabel = code ? countryNames[code] ?? code : "Ülke";
            const users = code ? activeUsersByCountry.get(code) ?? [] : [];
            const activityLabel = activity
              ? ` · ${activity.streams.toLocaleString("tr-TR")} stream · ${activity.liveVisitors} canlı ziyaretçi`
              : "";
            const intensity = activity
              ? 0.35 + Math.min(0.65, (activity.streams + activity.liveVisitors) / maxActivity)
              : 0;
            return (
              <path
                key={`country-${String(country.id ?? "unknown")}-${index}`}
                d={path(country) ?? undefined}
                fill={activity ? `rgba(214, 168, 95, ${intensity})` : "#263247"}
                stroke="#536078"
                strokeWidth="0.7"
                className="transition-colors hover:fill-[#e5bd7b]"
                onPointerEnter={() => setHoveredCode(code ?? null)}
                onPointerLeave={() => setHoveredCode(null)}
              >
                <title>{`${countryLabel}${activityLabel}${users.length ? ` · ${users.length} aktif kullanıcı` : ""}`}</title>
              </path>
            );
          })}
        </g>
      </svg>

      {hoveredCode ? (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[250px] rounded-xl border border-white/10 bg-[#121a2b]/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur">
          <p className="font-semibold text-[#e5bd7b]">{countryNames[hoveredCode] ?? hoveredCode}</p>
          {hoveredUsers.length ? <div className="mt-1.5 space-y-1 text-white/75">{hoveredUsers.slice(0, 5).map((user) => <p key={user.id}>{user.name} · {user.city}</p>)}{hoveredUsers.length > 5 ? <p className="text-white/45">+{hoveredUsers.length - 5} kullanıcı daha</p> : null}</div> : <p className="mt-1 text-white/50">Aktif kullanıcı görünmüyor.</p>}
          {hoveredActivity ? <p className="mt-1 text-white/45">{hoveredActivity.streams.toLocaleString("tr-TR")} stream · {hoveredActivity.liveVisitors} canlı ziyaretçi</p> : null}
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-[#121a2b]/90 px-3 py-1.5 text-[11px] text-white/65 backdrop-blur">
        Yakınlaştırmak için tekerleği kullanın · sürükleyerek hareket ettirin
      </div>
    </div>
  );
}
