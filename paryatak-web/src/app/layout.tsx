import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Paryatak — Discover Incredible India", template: "%s | Paryatak" },
  description: "Explore India's most beautiful destinations, plan your perfect trip, and discover the rich culture, history, and natural wonders of Incredible India.",
  keywords: ["India tourism", "travel India", "destinations", "trip planner", "Incredible India", "Paryatak"],
  openGraph: {
    title: "Paryatak — Discover Incredible India",
    description: "Your complete travel companion for exploring India's most beautiful destinations.",
    siteName: "Paryatak",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
