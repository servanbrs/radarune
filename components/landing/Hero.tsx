"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import DashboardPreview from "./DashboardPreview";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute left-[-150px] top-20 h-[500px] w-[500px] rounded-full bg-violet-700/20 blur-[150px]" />
      <div className="absolute right-[-150px] top-40 h-[500px] w-[500px] rounded-full bg-fuchsia-600/20 blur-[150px]" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-20 px-6 pt-24 lg:flex-row">

        <div className="max-w-2xl">

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-6xl font-black leading-none md:text-8xl"
          >
            Şarkını
            <br />
            Dünyaya
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
              Yayınla.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-lg leading-8 text-zinc-400"
          >
            Spotify, Apple Music, TikTok, YouTube Music ve
            50'den fazla dijital platforma şarkını tek panelden gönder.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex gap-4"
          >
            <Button
              size="lg"
              className="rounded-full bg-violet-600 px-8 hover:bg-violet-500"
            >
              Şarkını Gönder
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/20 bg-transparent"
            >
              Dashboard
            </Button>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-xl"
        >
          <DashboardPreview />
        </motion.div>

      </div>
    </section>
  );
}