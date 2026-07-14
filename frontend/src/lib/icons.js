import * as Lucide from "lucide-react";

/**
 * Resolve a kebab-case icon name to a Lucide component. Falls back to Sparkles.
 * Used to make icon selections editable from the admin panel.
 */
export function resolveIcon(name) {
  if (!name) return Lucide.Sparkles;
  const pascal = name.split("-").map((s) => s ? s[0].toUpperCase() + s.slice(1) : "").join("");
  return Lucide[pascal] || Lucide.Sparkles;
}
