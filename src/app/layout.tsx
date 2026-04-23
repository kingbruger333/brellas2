import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brellas",
  description: "Товары народного потребления оптом для магазинов, маркетплейсов и бизнеса.",
  icons: {
    icon: "/favicon.ico", // или favicon.png
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru" className="siteRoot">
      <body className="siteBody min-h-screen">
        {children}
      </body>
    </html>
  );
}