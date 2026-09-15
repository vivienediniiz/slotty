import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slotty — Seu calendário no lugar certo, na hora certa",
  description:
    "O Slotty organiza, automatiza e publica seus posts nas redes sociais nos melhores horários."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-brand-bg font-brand text-brand-ink antialiased">
        {children}
      </body>
    </html>
  );
}
