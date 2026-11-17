import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AcmeCommerce Customer Care — Instant Order & Return Resolution",
  description:
    "Official 24/7 automated customer resolution platform for AcmeCommerce. Instant returns, carrier tracking, and refund self-service.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Modern Web Fonts: Plus Jakarta Sans, Outfit, JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#f8fafc] selection:bg-indigo-100 selection:text-indigo-900 font-sans">
        {children}
      </body>
    </html>
  );
}
