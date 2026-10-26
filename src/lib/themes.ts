import { ThemeColor } from "@/types";

/**
 * Single source of truth for all theme definitions.
 * Used by Header (picker popover) and Settings (appearance tab).
 * CSS variables for each theme are declared in globals.css.
 */
export const THEMES: {
  key: ThemeColor;
  label: string;
  swatch: string;   // hex — matches --sidebar-active-bg in globals.css
}[] = [
  { key: "blue",   label: "Ocean Blue",    swatch: "#2563eb" },
  { key: "purple", label: "Royal Purple",  swatch: "#9333ea" },
  { key: "green",  label: "Forest Green",  swatch: "#16a34a" },
  { key: "rose",   label: "Cherry Rose",   swatch: "#e11d48" },
  { key: "orange", label: "Sunset Orange", swatch: "#ea580c" },
  { key: "teal",   label: "Deep Teal",     swatch: "#0d9488" },
  { key: "black",  label: "Midnight",      swatch: "#111827" },
];
