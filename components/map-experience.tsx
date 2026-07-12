"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { MapFallback } from "./map-fallback";

const OpportunityMap = dynamic(() => import("./opportunity-map").then((mod) => mod.OpportunityMap), { ssr: false, loading: () => <MapFallback /> });

export function MapExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    const canvas = document.createElement("canvas");
    const webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    const frame = window.requestAnimationFrame(() => setEnhanced(!reduced && desktop && webgl));
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(node);
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  return <div ref={containerRef} className="h-[480px] lg:h-[580px]">{enhanced ? <OpportunityMap active={active} /> : <MapFallback />}</div>;
}
