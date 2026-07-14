import { useEffect, useState } from "react";
import { api } from "./api";

let cache = null;
const listeners = new Set();

/**
 * useSiteContent — fetch the homepage/footer content document once
 * and keep components in sync when admin updates it.
 */
export function useSiteContent() {
  const [content, setContent] = useState(cache);
  useEffect(() => {
    const fn = (c) => setContent(c);
    listeners.add(fn);
    if (!cache) {
      api.get("/site-content").then((r) => {
        cache = r.data;
        listeners.forEach((l) => l(cache));
      });
    }
    return () => listeners.delete(fn);
  }, []);
  return content;
}

export function invalidateSiteContent() {
  cache = null;
  api.get("/site-content").then((r) => {
    cache = r.data;
    listeners.forEach((l) => l(cache));
  });
}
