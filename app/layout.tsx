import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/context/providers";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "UMEED — Hemophilia Registry & Clinical Intelligence",
  description:
    "Production-ready soft-neumorphic application for clinical hemophilia registries, factor treatment tracking, batch spreadsheet processing, and role-based intelligence.",
  keywords: ["UMEED", "BEFAL", "Neumorphism", "Hemophilia Registry", "PHPWS", "Clinical Intelligence"],
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
