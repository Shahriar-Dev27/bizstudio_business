"use client";

import MagicBento from "./react-bits/MagicBento";

const intelligenceCards = [
  { color: "#0c1324", label: "WHERE", title: "Location intelligence", description: "Compare access, competition, rent pressure, and delivery reach." },
  { color: "#0c1324", label: "HOW MUCH", title: "Budget boundaries", description: "Protect runway and see which setup matches the money available." },
  { color: "#0b1625", label: "MARKET SIGNAL", title: "Demand before commitment", description: "Turn assumptions into interviews, footfall checks, competitor mapping, and price tests." },
  { color: "#101229", label: "YOUR ROADMAP", title: "A practical launch sequence", description: "Move from customer discovery to a controlled pilot before making irreversible investments." },
  { color: "#0c1324", label: "WHEN", title: "Season and timing", description: "Plan around local demand cycles and realistic preparation windows." },
  { color: "#0c1324", label: "WHAT IF", title: "Risk radar", description: "Expose weak assumptions and the legal or operational facts still to verify." },
];

export function BusinessBento() {
  return (
    <MagicBento
      items={intelligenceCards}
      textAutoHide={false}
      enableStars
      enableSpotlight
      enableBorderGlow
      spotlightRadius={340}
      particleCount={7}
      enableTilt
      glowColor="83, 224, 255"
      clickEffect={false}
      enableMagnetism={false}
    />
  );
}
