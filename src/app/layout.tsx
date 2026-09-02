import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WalkRank - Modern Step Tracker & Analytics",
  description: "Aplikasi pelacak jumlah langkah harian dengan analitik untuk User dan Super Admin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#0B0F17] text-slate-100 antialiased min-h-screen selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
