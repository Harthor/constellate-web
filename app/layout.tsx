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
  title: "Constellate — AI-Powered Technology Gap Discovery",
  description:
    "Constellate analyzes ideas from leading technology sources to uncover hidden connections, emerging patterns, and opportunities for products that do not exist yet.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Constellate — AI-Powered Technology Gap Discovery",
    description:
      "Constellate analyzes ideas from leading technology sources to uncover hidden connections, emerging patterns, and opportunities for products that do not exist yet.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Constellate technology gap discovery overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Constellate — AI-Powered Technology Gap Discovery",
    description:
      "Constellate analyzes ideas from leading technology sources to uncover hidden connections, emerging patterns, and opportunities for products that do not exist yet.",
    images: ["/twitter-image"],
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
