"use client";

import { useEffect } from "react";
import { usePharmacyStore } from "@/store";

export default function ThemeProvider() {
  const themeColor = usePharmacyStore((s) => s.settings.themeColor);

  useEffect(() => {
    const root = document.documentElement;

    // Collect all theme-* classes first, THEN remove — avoids iterator mutation bug
    const toRemove = Array.from(root.classList).filter((cls) =>
      cls.startsWith("theme-")
    );
    toRemove.forEach((cls) => root.classList.remove(cls));

    root.classList.add(`theme-${themeColor}`);
  }, [themeColor]);

  return null;
}
