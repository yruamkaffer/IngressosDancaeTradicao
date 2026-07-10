import type { Metadata, Viewport } from "next";
import { eventConfig } from "@/config/event";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${eventConfig.name} | Ingressos`,
    template: `%s | ${eventConfig.name}`
  },
  description:
    "Compre ingressos para a 14ª Mostra de Dança dos Alunos da Dança & Tradição em Joinville. Ingresso promocional disponível para todos, Pix e entrada por ordem de chegada.",
  applicationName: `${eventConfig.name} - Ingressos`,
  keywords: [
    "Sob a Luz da Dança",
    "Dança & Tradição",
    "mostra de dança",
    "ingressos dança Joinville",
    "Teatro CENSUPEG",
    "ingresso promocional"
  ],
  authors: [{ name: eventConfig.studioName, url: eventConfig.school.instagramUrl }],
  creator: eventConfig.studioName,
  publisher: eventConfig.studioName,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: eventConfig.studioName,
    title: `${eventConfig.name} | Ingressos`,
    description:
      "Ingressos para a 14ª Mostra de Dança dos Alunos no Teatro CENSUPEG, em Joinville. Promocional disponível para todos.",
    images: [
      {
        url: absoluteUrl(eventConfig.heroImage),
        width: 1200,
        height: 630,
        alt: `${eventConfig.name} - ${eventConfig.edition}`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${eventConfig.name} | Ingressos`,
    description: "Compre seu ingresso para a mostra da Dança & Tradição no Teatro CENSUPEG, em Joinville.",
    images: [absoluteUrl(eventConfig.heroImage)]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/site-icon.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#2563eb"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <div id="conteudo">{children}</div>
      </body>
    </html>
  );
}
