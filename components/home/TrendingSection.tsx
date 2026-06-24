'use client';

import { TrendingCard } from './TrendingCard';
import { Music, Heart, Radio, Zap } from 'lucide-react';

export function TrendingSection() {
  const trendingPlaylists = [
    {
      title: 'Chart Toppers',
      description: 'The hottest tracks dominating music charts worldwide',
      count: 156,
      icon: <Zap className="h-8 w-8 text-yellow-400" />,
    },
    {
      title: 'Underground Gems',
      description: 'Undiscovered artists breaking through independent labels',
      count: 234,
      icon: <Radio className="h-8 w-8 text-pink-400" />,
    },
    {
      title: 'Mood Vibes',
      description: 'Curated playlists for every emotion and moment',
      count: 89,
      icon: <Heart className="h-8 w-8 text-red-400" />,
    },
    {
      title: 'Genre Essentials',
      description: 'Essential tracks that define each music genre',
      count: 412,
      icon: <Music className="h-8 w-8 text-purple-400" />,
    },
  ];

  return (
    <section className="relative py-24 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl md:text-5xl font-bold text-white">
            Trending Now
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Explore our most popular collections and discover music that resonates with listeners worldwide
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingPlaylists.map((playlist, index) => (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <TrendingCard {...playlist} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
