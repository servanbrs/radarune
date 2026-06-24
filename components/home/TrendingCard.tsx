'use client';

import { Music, Play } from 'lucide-react';

interface TrendingCardProps {
  title: string;
  description: string;
  count: number;
  icon?: React.ReactNode;
}

export function TrendingCard({
  title,
  description,
  count,
  icon = <Music className="h-8 w-8 text-purple-400" />,
}: TrendingCardProps) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl transition duration-300 hover:border-white/30 hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10">
      {/* Hover glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-purple-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500 -z-10" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
            {icon}
          </div>
          <Play className="h-5 w-5 text-white/30 group-hover:text-purple-400 transition" />
        </div>

        <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
        <p className="mb-4 text-sm text-white/60 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className="text-xs font-semibold text-purple-400">{count} tracks</span>
          <button className="rounded-lg bg-purple-600/50 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-600 transition">
            Play
          </button>
        </div>
      </div>
    </div>
  );
}
