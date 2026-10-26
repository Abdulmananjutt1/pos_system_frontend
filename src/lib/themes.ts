import { ThemeColor } from "@/types";

/**
 * Single source of truth for all theme definitions.
 * Used by Header (picker popover) and Settings (appearance tab).
 * CSS variables for each theme are declared in globals.css.
 */
export const THEMES: {
  key: ThemeColor;
  label: string;
  swatch: string;       // accent hex shown in the colour picker dot
  previewBg?: string;   // sidebar preview bg hex (optional, for white theme)
}[] = [
  { key: "blue",   label: "Vivid Blue",      swatch: "#2563eb" },
  { key: "indigo", label: "Deep Indigo",     swatch: "#4f46e5" },
  { key: "purple", label: "Rich Purple",     swatch: "#7c3aed" },
  { key: "green",  label: "Emerald Green",   swatch: "#059669" },
  { key: "teal",   label: "Cyan Teal",       swatch: "#0891b2" },
  { key: "cyan",   label: "Sky Blue",        swatch: "#0ea5e9" },
  { key: "orange", label: "Amber Orange",    swatch: "#d97706" },
  { key: "rose",   label: "Crimson Rose",    swatch: "#e11d48" },
  { key: "black",  label: "Jet Black",       swatch: "#09090b" },
  { key: "white",  label: "Snow White",      swatch: "#f1f5f9", previewBg: "#ffffff" },
];
