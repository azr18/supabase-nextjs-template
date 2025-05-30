import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google'

const productName = process.env.NEXT_PUBLIC_PRODUCTNAME || "Invoice Reconciler SaaS";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: `${productName} - AI Business Automation Platform`,
    template: `%s | ${productName}`
  },
  description: "Transform your business operations with custom AI solutions. Invoice reconciliation, sales automation, and intelligent process optimization for enterprise success.",
  keywords: ["AI automation", "business intelligence", "invoice reconciliation", "process optimization", "enterprise AI", "custom AI solutions"],
  authors: [{ name: productName }],
  creator: productName,
  publisher: productName,
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: productName,
    title: `${productName} - AI Business Automation Platform`,
    description: "Transform your business operations with custom AI solutions. Invoice reconciliation, sales automation, and intelligent process optimization for enterprise success.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${productName} - AI Business Automation Platform`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${productName} - AI Business Automation Platform`,
    description: "Transform your business operations with custom AI solutions. Invoice reconciliation, sales automation, and intelligent process optimization.",
    images: ["/twitter-image.png"],
    creator: "@yourtwitterhandle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  category: "technology",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let theme = process.env.NEXT_PUBLIC_THEME
  if(!theme) {
    theme = "theme-sass3"
  }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  return (
    <html lang="en">
    <body className={theme}>
      {children}
      <Analytics />
      <CookieConsent />
      { gaID && (
          <GoogleAnalytics gaId={gaID}/>
      )}

    </body>
    </html>
  );
}
