import type { Metadata } from "next";
import "./globals.css";
import "./paper-arcade.css";

export const metadata: Metadata = {
  title: "BizGuide AI — Business planning partner for Bangladesh",
  description:
    "Talk through a business idea with an AI planning partner for Bangladesh. Explore customers, location, budget, timing, and risks, then plan small tests and verify details locally.",
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
