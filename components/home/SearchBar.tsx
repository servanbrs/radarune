'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="group relative">
        {/* Animated glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/50 to-purple-400/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000" />

        {/* Search container */}
        <div className="relative flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 backdrop-blur-xl transition duration-300 group-hover:bg-white/10 group-hover:border-white/40">
          <Search className="h-5 w-5 text-white/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by song, artist, or mood..."
            className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-lg"
          />
          <button
            onClick={handleSearch}
            className="ml-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-2 font-semibold text-white hover:from-purple-500 hover:to-purple-400 transition duration-300 hover:shadow-lg hover:shadow-purple-500/50"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
