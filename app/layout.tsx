import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizGuide AI — Plan a smarter business in Bangladesh",
  description:
    "A guided business planning prototype for exploring location, budget, timing, setup needs, and market considerations in Bangladesh.",
  icons: {
    icon: "/brand/bizguide-logo.png",
    apple: "/brand/bizguide-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Prevent Dark Reader from rewriting markup before React hydrates. */}
        <meta name="darkreader-lock" />
      </head>
      <body>{children}</body>
    </html>
  );
}
