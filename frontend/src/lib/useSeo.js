import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "./api";

/**
 * useSeo — fetch per-route SEO from the DB and apply it to <head>.
 * Falls back to home ("/") if no per-path entry exists.
 */
function setMeta(name, value, attr = "name") {
  if (!value) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

export function useSeo() {
  const loc = useLocation();
  useEffect(() => {
    let cancel = false;
    const path = loc.pathname === "/" ? "/" : `/${loc.pathname.split("/")[1]}`;
    api.get(`/seo?path=${encodeURIComponent(path)}`).then((r) => {
      if (cancel || !r.data) return;
      const d = r.data;
      if (d.title) document.title = d.title;
      setMeta("description", d.description);
      setMeta("og:title", d.og_title || d.title, "property");
      setMeta("og:description", d.og_description || d.description, "property");
      if (d.og_image) setMeta("og:image", d.og_image, "property");
    }).catch(() => {});
    return () => { cancel = true; };
  }, [loc.pathname]);
}
