import { useEffect, useState } from "react";
import { api } from "./api";

let cache = null;
const listeners = new Set();

export function useSiteContent() {
  const [content, setContent] = useState(cache);

  useEffect(() => {
    const fn = (c) => {
      console.log("CONTENT LOADED:", c);
      setContent(c);
    };

    listeners.add(fn);

    if (!cache) {
      api.get("/site-content")
        .then((r) => {
          console.log("SITE CONTENT RESPONSE:", r.data);
          cache = r.data;
          listeners.forEach((l) => l(cache));
        })
        .catch((e) => {
          console.error("SITE CONTENT ERROR:", e);
        });
    }

    return () => listeners.delete(fn);
  }, []);

  return content;
}

export function invalidateSiteContent() {
  cache = null;

  api.get("/site-content")
    .then((r) => {
      cache = r.data;
      listeners.forEach((l) => l(cache));
    })
    .catch((err) => {
      console.error("SITE CONTENT INVALIDATE ERROR:", err);
    });
}