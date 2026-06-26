import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Sob a Luz da Dança | Ingressos",
  description: "MVP para venda manual de ingressos com Pix e validação via WhatsApp."
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

