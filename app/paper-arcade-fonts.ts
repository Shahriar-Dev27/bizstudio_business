import { IBM_Plex_Mono, Josefin_Slab, Space_Grotesk } from "next/font/google";

// Shared next/font definitions, self-hosted at build time with font-display: swap.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--font-mk-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mk-mono" });
const josefinSlab = Josefin_Slab({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", variable: "--font-mk-slab", fallback: ["Georgia", "serif"] });

export const paperArcadeFontVariables = `${spaceGrotesk.variable} ${plexMono.variable} ${josefinSlab.variable}`;
