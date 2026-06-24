'use client';

import { Music, Github, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-md py-12 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-2">
                <Music className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">RadarUne</span>
            </div>
            <p className="text-sm text-white/60">
              Discover music beyond algorithms with precision radar technology
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Press
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Cookies
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/60 hover:text-white transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <p className="text-sm text-white/60">
              © 2024 RadarUne. All rights reserved.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:border-purple-500/50 hover:text-purple-400 transition"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:border-purple-500/50 hover:text-purple-400 transition"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:border-purple-500/50 hover:text-purple-400 transition"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
