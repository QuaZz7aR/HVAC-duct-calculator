import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { uk } from "@/lib/i18n/uk";
import "./globals.css";

export const metadata: Metadata = {
  title: uk.appTitle,
  description: uk.appSubtitle,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
