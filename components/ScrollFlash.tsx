"use client";

import { useEffect } from "react";

/**
 * Tiny client component that adds a brief ring animation to the first element
 * inside `#top-gaps .absence-flashtarget` when the user arrives at the #top-gaps
 * anchor. Confirms visually which section the "See this week's gaps ↓" CTA
 * scrolled them to.
 *
 * Respects prefers-reduced-motion.
 */
export default function ScrollFlash({ targetId = "top-gaps" }: { targetId?: string }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const flashFirst = () => {
      const section = document.getElementById(targetId);
      if (!section) return;
      const firstCard = section.querySelector<HTMLElement>(".flash-target");
      if (!firstCard) return;
      firstCard.classList.remove("ring-flash"); // reset in case
      // Force reflow so re-adding the class restarts the animation.
      void firstCard.offsetWidth;
      firstCard.classList.add("ring-flash");
      window.setTimeout(() => firstCard.classList.remove("ring-flash"), 1200);
    };

    const onHashChange = () => {
      if (window.location.hash === `#${targetId}`) {
        // Delay a hair so smooth scroll settles first.
        window.setTimeout(flashFirst, 350);
      }
    };

    // Fire on initial load if already at the hash.
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [targetId]);

  return null;
}
