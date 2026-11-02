import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import HideOnAdmin from "@/components/HideOnAdmin";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Imaan's Online — Quality Products, Authenticity & Craft",
    template: "%s | Imaan's Online",
  },
  description:
    "Explore Imaan's Online: premium filter coffee, skincare, authentic spices, luxury fragrances, imported bedding, and quality groceries.",
  keywords: [
    "Imaan's",
    "iBrew",
    "filter coffee",
    "spices",
    "perfumes",
    "mattresses",
    "dates",
    "skincare",
    "online shopping",
  ],
  authors: [{ name: "Imaan's Online" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HideOnAdmin>
          <Navbar />
        </HideOnAdmin>
        {children}
        <HideOnAdmin>
          <Footer />
        </HideOnAdmin>
      </body>
    </html>
  );
}
