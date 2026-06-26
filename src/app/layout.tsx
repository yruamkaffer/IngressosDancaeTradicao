import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sob a Luz da Dança | Ingressos",
  description: "Venda de ingressos com reserva de assentos, pagamento via Pix e validação manual."
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