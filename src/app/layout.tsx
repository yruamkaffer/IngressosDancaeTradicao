import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sob a Luz da Dan\u00e7a | Ingressos",
  description: "Venda de ingressos com reserva de assentos, pagamento via Pix e valida\u00e7\u00e3o manual.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/site-icon.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}