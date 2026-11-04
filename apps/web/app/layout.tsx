import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "eLoop — AI Device Lifecycle Intelligence",
  description: "Upload a photo of your electronic device. Our AI analyzes fixability, suggests creative upcycling ideas, and connects you with certified e-waste recycling partners.",
  keywords: ["e-waste", "recycling", "device repair", "AI diagnostics", "sustainability", "upcycling", "electronics"],
  authors: [{ name: "eLoop Team" }],
  creator: "eLoop",
  publisher: "eLoop",
  robots: "index, follow",
  openGraph: {
    title: "eLoop — AI Device Lifecycle Intelligence",
    description: "Upload a photo of your electronic device. Our AI analyzes fixability, suggests creative upcycling ideas, and connects you with certified e-waste recycling partners.",
    type: "website",
    locale: "en_US",
    siteName: "eLoop",
  },
  twitter: {
    card: "summary_large_image",
    title: "eLoop — AI Device Lifecycle Intelligence",
    description: "Upload a photo of your electronic device. Our AI analyzes fixability, suggests creative upcycling ideas, and connects you with certified e-waste recycling partners.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F2C33",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}