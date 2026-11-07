import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SideNav, TabBar } from "@/components/Nav";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const description =
  "Upload a photo of your electronic device. eLoop tells you whether to repair, reuse or recycle it, and connects you with certified e-waste recycling partners.";

export const metadata: Metadata = {
  title: "eLoop: AI Device Lifecycle Intelligence",
  description,
  keywords: ["e-waste", "recycling", "device repair", "AI diagnostics", "sustainability", "electronics"],
  authors: [{ name: "eLoop Team" }],
  creator: "eLoop",
  publisher: "eLoop",
  robots: "index, follow",
  openGraph: {
    title: "eLoop: AI Device Lifecycle Intelligence",
    description,
    type: "website",
    locale: "en_US",
    siteName: "eLoop",
  },
  twitter: {
    card: "summary_large_image",
    title: "eLoop: AI Device Lifecycle Intelligence",
    description,
  },
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
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} antialiased`}>
      <body className="min-h-dvh bg-[#EAE6DF]">
        <div className="min-h-dvh md:flex">
          <SideNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
        <TabBar />
      </body>
    </html>
  );
}