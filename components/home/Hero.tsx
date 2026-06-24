'use client';

import { SearchBar } from './SearchBar';

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-20">
      {/* Animated glowing background elements */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
        {/* Badge */}
        <div className="mb-8 inline-flex animate-fade-in">
          <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300">
            ✨ Premium Music Discovery Platform
          </span>
        </div>

        {/* Main heading */}
        <h1 className="animate-fade-in-up text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white mb-6 bg-clip-text bg-gradient-to-br from-white via-purple-200 to-purple-400 text-transparent">
          RADARUNE
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mb-12 font-light">
          Discover Music Beyond Algorithms
        </p>

        {/* Search bar */}
        <div className="animate-fade-in-up w-full mb-16">
          <SearchBar onSearch={(query) => console.log('Searching for:', query)} />
        </div>

        {/* CTA Text */}
        <p className="text-sm text-white/40 animate-fade-in-up">
          Explore thousands of curated playlists and discover your next favorite artist
        </p>
      </div>
    </section>
  );
}
