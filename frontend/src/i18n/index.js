/**
 * Refixion i18n — architecture only, Dutch (nl) is the active locale.
 * English/German/French files can be added later without changing consumer code.
 *
 * Usage:
 *   import { t } from "@/i18n";
 *   t("nav.home")   →  "Home"
 *   t("hero.book")  →  "Reparatie boeken"
 *
 * When a language switcher is introduced later, call setLocale("en") to swap.
 */

import nl from "./nl";

const locales = { nl };
let currentLocale = "nl";
const listeners = new Set();

export function setLocale(locale) {
  if (!locales[locale]) return;
  currentLocale = locale;
  listeners.forEach((fn) => fn(locale));
}
export function getLocale() { return currentLocale; }
export function subscribeLocale(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function resolve(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

/**
 * Translate a dotted key. Returns the key back if not found (safe fallback).
 * Optional variable interpolation: t("reviews.headline", { avg: 4.9 })
 */
export function t(key, vars = {}) {
  const bundle = locales[currentLocale] || locales.nl;
  const raw = resolve(bundle, key);
  const str = typeof raw === "string" ? raw : key;
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export default t;
