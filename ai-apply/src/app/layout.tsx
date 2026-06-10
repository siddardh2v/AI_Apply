import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";
import { PWARegister } from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Jobward",
  description:
    "Jobward — the trustworthy job copilot: discover live jobs, tailor materials honestly, apply, and track every reply in one inbox.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Jobward", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0A0E1A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
