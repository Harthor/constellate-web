import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://constellate.fyi"
  ),
  title: "Constellate — Find what's missing in tech",
  description:
    "Every week, Claude reads tech ideas from 9 feeds and finds the gaps — things the community keeps circling but nobody has built yet. Real starting points for what to build next.",
  openGraph: {
    title: "Constellate — Find what's missing in tech",
    description:
      "Every week, Claude reads 9 tech feeds and surfaces absences — real gaps where something could exist but doesn't. A shortlist of what to build next.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Constellate — Find what's missing in tech",
    description:
      "Every week, Claude reads 9 tech feeds and surfaces the gaps — what could exist but doesn't.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <head>
        <Script
          src="https://plausible.io/js/pa-Ot3gS09DJFN7Q-FHHFqmA.js"
          strategy="beforeInteractive"
        />
        <Script id="plausible-init" strategy="beforeInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();`}
        </Script>
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
