import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NourQuran Studio — Créateur de vidéos coraniques",
  description:
    "Créez des vidéos de récitation coranique professionnelles avec synchronisation karaoké, prêtes pour YouTube, Reels et TikTok.",
  keywords: ["Coran", "récitation", "vidéo", "karaoké", "islam", "arabe"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="dark">
      <head>
        {/*
          Les polices arabes Amiri et Scheherazade sont chargées via CSS direct
          pour contourner les limites de next/font avec les polices arabiques.
          Ce chargement est acceptable car il concerne l'affichage du contenu arabe,
          pas le LCP principal.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Scheherazade+New:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
