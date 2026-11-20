import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROMOTOR - PT PLN (Persero) UP3 Banten Selatan",
  description: "Aplikasi Monitoring & Manajemen Konstruksi Terpadu PLN UP3 Banten Selatan",
  icons: {
    icon: "/Logo_PLN.png",
    shortcut: "/Logo_PLN.png",
    apple: "/Logo_PLN.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
