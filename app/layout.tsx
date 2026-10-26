import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Le Cercle d’Or — Compose ton Top 10",
  description: "Classe les 30 nommés, compose ton Top 10 du Ballon d’Or et découvre les choix de tes amis.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
