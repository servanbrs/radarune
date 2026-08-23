"use client";

import { useEffect } from "react";

/**
 * Keeps the primary header out of the way while a user scrolls down on a
 * small screen, then brings it back as soon as they scroll up. The data
 * attribute lets server-rendered layouts opt in without becoming client
 * components themselves.
 */
export function ScrollHideHeaders() {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const currentScrollY = window.scrollY;
      const headers = document.querySelectorAll<HTMLElement>("[data-scroll-hide]");

      if (currentScrollY <= 24 || currentScrollY < lastScrollY - 4) {
        headers.forEach((header) => header.setAttribute("data-scroll-hidden", "false"));
      } else if (currentScrollY > lastScrollY + 8) {
        headers.forEach((header) => header.setAttribute("data-scroll-hidden", "true"));
      }

      lastScrollY = currentScrollY;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
