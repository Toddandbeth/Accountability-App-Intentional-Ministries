import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = "https://app.intentionalministries.com";
const DESCRIPTION = "Weekly accountability check-ins for small groups, from Intentional Ministries.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Intentional Ministries Accountability",
  description: DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Accountability",
  },
  // Previously unset, so link previews (e.g. sharing the app's URL in
  // iMessage) fell back to whatever a scraper happened to pick up off the
  // page rather than deliberate branding. og-image.png is a purpose-built
  // 1200x630 card (navy background, white logo), not a repurposed app icon.
  openGraph: {
    title: "Intentional Ministries Accountability",
    description: DESCRIPTION,
    url: APP_URL,
    siteName: "Intentional Ministries Accountability",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intentional Ministries Accountability",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#253551",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Required for env(safe-area-inset-*) to resolve to real values instead
  // of 0 — otherwise the bottom nav can sit under the iPhone home
  // indicator's gesture area.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
