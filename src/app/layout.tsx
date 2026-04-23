import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LeadChoiceProvider } from "@/components/lead-choice-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brellas",
  description: "Товары народного потребления оптом для магазинов, маркетплейсов и бизнеса.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru" className="siteRoot">
      <body className="siteBody min-h-screen">
        <LeadChoiceProvider>{children}</LeadChoiceProvider>
      </body>
    </html>
  );
}
