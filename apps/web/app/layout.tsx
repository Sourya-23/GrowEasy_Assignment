import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowEasy · AI CSV Importer",
  description: "Intelligently map any lead CSV into GrowEasy CRM format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Inter loaded at runtime; build stays offline-safe. Falls back to system-ui. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
