import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WalkRank - Modern Step Tracker & Analytics",
  description: "Aplikasi pelacak jumlah langkah harian dengan analitik untuk User dan Super Admin.",
  icons: {
    icon: [
      { url: "/icon.png?v=2", type: "image/png" },
      { url: "/favicon.ico?v=2", sizes: "any" },
    ],
    shortcut: "/icon.png?v=2",
    apple: "/icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${inter.variable}`}>
      <body className={`${inter.className} bg-[#0B0F17] text-slate-100 antialiased min-h-screen selection:bg-red-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
