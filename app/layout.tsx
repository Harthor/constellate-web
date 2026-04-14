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
  title: "Constellate — The hidden patterns in what you're already reading",
  description:
    "Constellate watches 8 tech sources and surfaces constellations: groups of ideas that together reveal patterns no single source names out loud.",
  openGraph: {
    title: "Constellate — The hidden patterns in what you're already reading",
    description:
      "Groups of ideas from Hacker News, arXiv, YC, Product Hunt and more that together reveal patterns no single source names out loud.",
    url: "/",
    type: "website",
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
      <body className="min-h-screen antialiased">
        <Script
          src="https://plausible.io/js/pa-Ot3gS09DJFN7Q-FHHFqmA.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
