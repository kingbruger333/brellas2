import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LeadChoiceProvider } from "@/components/lead-choice-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brellas",
  description: "Brellas - товары для магазинов, маркетплейсов и бизнеса с удобным заказом.",
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
      <body className="siteBody">
        <LeadChoiceProvider>{children}</LeadChoiceProvider>
      </body>
    </html>
  );
}
