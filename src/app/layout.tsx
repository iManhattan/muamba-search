import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muamba Search - Scanner de Leilões da Receita Federal",
  description: "Busca automatizada de lotes e produtos com fotos e avisos oficiais para revenda nos leilões da Receita Federal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
