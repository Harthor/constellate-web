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
    "We analyze signals from 9 leading tech sources. Constellate surfaces the gaps — things the community keeps circling but nobody has built yet.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Constellate — Find what's missing in tech",
    description:
      "We analyze signals from 9 leading tech sources and surface absences — real gaps where something could exist but doesn't.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Constellate — Find what's missing in tech",
    description:
      "We analyze signals from 9 leading tech sources and surface the gaps — what could exist but doesn't.",
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
